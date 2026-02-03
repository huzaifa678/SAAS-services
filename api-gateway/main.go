package main

import (
	"context"
	"log"
	"net/http"

	"github.com/huzaifa678/SAAS-services/endpoint"
	"github.com/huzaifa678/SAAS-services/service"
	"github.com/huzaifa678/SAAS-services/tracing"
	"github.com/huzaifa678/SAAS-services/transport"
	"github.com/huzaifa678/SAAS-services/utils"
)

func main() {
	cfg := utils.Load()

	shutdown := tracing.InitTracer(cfg.App.Name)
	defer shutdown(context.Background())

	authSvc := service.NewAuthService(
		cfg.Services.Auth.URL,
		cfg.CircuitBreaker,
	)

	subSvc := service.NewSubscriptionService(
		cfg.Services.Subscription.URL,
		cfg.CircuitBreaker,
	)

	authEndpoint := endpoint.MakeAuthEndpoint(authSvc)
	subEndpoint := endpoint.MakeSubscriptionEndpoint(subSvc)

	authEndpoint = endpoint.RateLimitMiddleware(10, 5)(authEndpoint)
	subEndpoint = endpoint.RateLimitMiddleware(5, 3)(subEndpoint)

	authEndpoint = endpoint.TracedEndpoint("AuthEndpoint", endpoint.MakeAuthEndpoint(authSvc))
	subEndpoint = endpoint.TracedEndpoint("SubscriptionEndpoint", endpoint.MakeSubscriptionEndpoint(subSvc))

	authHandler := transport.NewGraphQLHTTPHandler(authEndpoint)
	subHandler := transport.NewGraphQLHTTPHandler(subEndpoint)

	mux := http.NewServeMux()
	mux.Handle("/api/auth/", authHandler)
	mux.Handle("/api/subscription/", subHandler)

	corsHandler := transport.CORSMiddleware(cfg.CORS.AllowedOrigins)(mux)

	log.Printf("%s running on :%s (%s)", cfg.App.Name, cfg.App.Port, cfg.App.Env)
	log.Fatal(http.ListenAndServe(":"+cfg.App.Port, corsHandler))
}