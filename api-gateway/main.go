package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-kit/kit/log/level"
	kitlog "github.com/go-kit/log"
	"github.com/huzaifa678/SAAS-services/endpoint"
	"github.com/huzaifa678/SAAS-services/interceptor"
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

	var logger kitlog.Logger
	logger = kitlog.NewJSONLogger(kitlog.NewSyncWriter(os.Stdout))
	logger = level.NewFilter(logger, level.AllowAll())
	logger = kitlog.With(
		logger,
		"ts", kitlog.DefaultTimestampUTC,
		"caller", kitlog.DefaultCaller,
		"service", cfg.App.Name,
	)

	shutdownTracer := tracing.InitTracer(cfg.App.Name)
	defer shutdownTracer(context.Background())

	ctx, stop := signal.NotifyContext(context.Background(), interruptSignals...)
	defer stop()
	
	waitGroup, ctx := errgroup.WithContext(ctx)

	runGoKitHTTP(ctx, waitGroup, cfg, logger)

	if err := waitGroup.Wait(); err != nil {
		level.Error(logger).Log("msg", "error during shutdown", "err", err)
	}
}

func runGoKitHTTP(ctx context.Context, waitGroup *errgroup.Group, cfg *utils.Config, logger kitlog.Logger) {

	jwtSecret := cfg.Jwt.Secret

	subSvc := service.NewForwardService(
		cfg.Services.Subscription.URL,
		"subscription-service",
		"Subscription service temporarily unavailable",
		cfg.CircuitBreaker,
	)

	authSvc := service.NewForwardService(
		cfg.Services.Auth.URL,
		"auth-service",
		"Auth service temporarily unavailable",
		cfg.CircuitBreaker,
	)

	billSvc := service.NewForwardService(
		cfg.Services.Billing.URL,
		"billing-service",
		"Billing service temporarily unavailable",
		cfg.CircuitBreaker,
	)

	authEndpoint := endpoint.MakeAuthEndpoint(authSvc)
	subEndpoint := endpoint.MakeSubscriptionEndpoint(subSvc)
	billEndpoint := endpoint.MakeBillingEndpoint(billSvc)

	authEndpoint = endpoint.LoggingMiddleware(logger)(authEndpoint)
	subEndpoint = endpoint.LoggingMiddleware(logger)(subEndpoint)
	billEndpoint = endpoint.LoggingMiddleware(logger)(billEndpoint)

	authEndpoint = endpoint.RateLimitMiddleware(10, 5)(authEndpoint)
	subEndpoint = endpoint.RateLimitMiddleware(5, 3)(subEndpoint)
	billEndpoint = endpoint.RateLimitMiddleware(5, 3)(billEndpoint)

	subEndpoint = interceptor.JWTMiddleware(jwtSecret)(subEndpoint)
	billEndpoint = interceptor.JWTMiddleware(jwtSecret)(billEndpoint)

	authEndpoint = endpoint.TracedEndpoint("AuthEndpoint", authEndpoint)
	subEndpoint = endpoint.TracedEndpoint("SubscriptionEndpoint", subEndpoint)
	billEndpoint = endpoint.TracedEndpoint("BillingEndpoint", billEndpoint)

	authHandler := transport.NewGraphQLHTTPHandler(authEndpoint)
	subHandler := transport.NewGraphQLHTTPHandler(subEndpoint)
	billHandler := transport.NewRESTHTTPHandler(billEndpoint, logger)

	mux := http.NewServeMux()
	mux.Handle("/api/auth/", authHandler)
	mux.Handle("/api/subscription/", subHandler)
	mux.Handle("/api/billing/", billHandler)

	corsHandler := transport.CORSMiddleware(cfg.CORS.AllowedOrigins)(mux)

	server := &http.Server{
		Addr:    ":" + cfg.App.Port,
		Handler: corsHandler,
	}

	level.Info(logger).Log(
		"msg", "API Gateway started",
		"port", cfg.App.Port,
	)

	waitGroup.Go(func() error {
		go func() {
			<-ctx.Done()
			level.Info(logger).Log("msg", "Shutting down API Gateway")

			shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := server.Shutdown(shutdownCtx); err != nil {
				level.Error(logger).Log("msg", "server shutdown failed", "err", err)
			} else {
				level.Info(logger).Log("msg", "API Gateway stopped gracefully")
			}
		}()

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			return err
		}
		return nil
	})
}