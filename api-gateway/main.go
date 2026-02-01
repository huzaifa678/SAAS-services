package main

import (
	"log"
	"net/http"

	"github.com/huzaifa678/SAAS-services/endpoint"
	"github.com/huzaifa678/SAAS-services/service"
	"github.com/huzaifa678/SAAS-services/transport"
	"github.com/huzaifa678/SAAS-services/utils"
)

func main() {
	cfg := utils.Load()

	authSvc := service.NewAuthService(cfg.Services.Auth.URL, cfg.CircuitBreaker)

	authEndpoint := endpoint.MakeAuthEndpoint(authSvc)

	handler := transport.NewGraphQLHTTPHandler(authEndpoint)

	corsHandler := transport.CORSMiddleware(cfg.CORS.AllowedOrigins)(handler)

	log.Printf("%s running on :%s (%s)", cfg.App.Name, cfg.App.Port, cfg.App.Env)
	log.Fatal(http.ListenAndServe(":"+cfg.App.Port, corsHandler))
}
