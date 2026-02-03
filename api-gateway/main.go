package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/huzaifa678/SAAS-services/endpoint"
	"github.com/huzaifa678/SAAS-services/service"
	"github.com/huzaifa678/SAAS-services/tracing"
	"github.com/huzaifa678/SAAS-services/transport"
	"github.com/huzaifa678/SAAS-services/utils"
	"golang.org/x/sync/errgroup"
)

var interruptSignals = []os.Signal{
	os.Interrupt,
	syscall.SIGTERM,
	syscall.SIGHUP,
	syscall.SIGQUIT,
}

func main() {
	cfg := utils.Load()

	shutdownTracer := tracing.InitTracer(cfg.App.Name)
	defer shutdownTracer(context.Background())

	ctx, stop := signal.NotifyContext(context.Background(), interruptSignals...)
	defer stop()
	
	waitGroup, ctx := errgroup.WithContext(ctx)

	runGoKitHTTP(ctx, waitGroup, cfg)

	if err := waitGroup.Wait(); err != nil {
		log.Fatalf("error during shutdown: %v", err)
	}
}

func runGoKitHTTP(ctx context.Context, waitGroup *errgroup.Group, cfg *utils.Config) {
	authSvc := service.NewAuthService(cfg.Services.Auth.URL, cfg.CircuitBreaker)
	subSvc := service.NewSubscriptionService(cfg.Services.Subscription.URL, cfg.CircuitBreaker)

	authEndpoint := endpoint.MakeAuthEndpoint(authSvc)
	subEndpoint := endpoint.MakeSubscriptionEndpoint(subSvc)

	authEndpoint = endpoint.RateLimitMiddleware(10, 5)(authEndpoint)
	subEndpoint = endpoint.RateLimitMiddleware(5, 3)(subEndpoint)

	authEndpoint = endpoint.TracedEndpoint("AuthEndpoint", authEndpoint)
	subEndpoint = endpoint.TracedEndpoint("SubscriptionEndpoint", subEndpoint)

	authHandler := transport.NewGraphQLHTTPHandler(authEndpoint)
	subHandler := transport.NewGraphQLHTTPHandler(subEndpoint)

	mux := http.NewServeMux()
	mux.Handle("/api/auth/", authHandler)
	mux.Handle("/api/subscription/", subHandler)

	corsHandler := transport.CORSMiddleware(cfg.CORS.AllowedOrigins)(mux)

	server := &http.Server{
		Addr:    ":" + cfg.App.Port,
		Handler: corsHandler,
	}

	log.Printf("API Gateway running on :%s", cfg.App.Port)

	waitGroup.Go(func() error {
		go func() {
			<-ctx.Done()
			log.Println("Shutting down API Gateway...")

			shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := server.Shutdown(shutdownCtx); err != nil {
				log.Printf("Error shutting down server: %v", err)
			} else {
				log.Println("API Gateway stopped gracefully")
			}
		}()

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			return err
		}
		return nil
	})
}
