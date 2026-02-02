package service

import (
	"context"
	"errors"
	"net/http"

	kithttp "github.com/go-kit/kit/transport/http"

	"github.com/huzaifa678/SAAS-services/circuit"
	"github.com/huzaifa678/SAAS-services/utils"
)

type SubscriptionService interface {
	Forward(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error)
}

type subscriptionService struct {
	forward func(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error)
}

func NewSubscriptionService(baseURL string, cbCfg utils.CircuitBreakerConfig) SubscriptionService {
	s := &subscriptionService{}

	u := mustParseURL(baseURL)

	client := kithttp.NewClient(
		"POST",
		u,
		encodeGraphQLRequest,
		decodeGraphQLResponse,
	).Endpoint()

	wrapped := circuit.WrapWithBreaker(
		func(ctx context.Context) (interface{}, error) {
			v := ctx.Value("graphqlRequest")
			if v == nil {
				return nil, errors.New("no request in context")
			}

			req := v.(struct {
				Body   []byte
				Header http.Header
			})

			return client(ctx, req)
		},
		"subscription-service",
		cbCfg,
	)

	s.forward = func(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error) {
		ctx = context.WithValue(ctx, "graphqlRequest", struct {
			Body   []byte
			Header http.Header
		}{body, headers})

		res, err := wrapped(ctx)
		if err != nil {
			fallback := []byte(`{
				"errors": [{
					"message": "Subscription service temporarily unavailable"
				}]
			}`)
			return fallback, http.StatusServiceUnavailable, nil
		}

		r := res.(struct {
			Body   []byte
			Status int
		})
		return r.Body, r.Status, nil
	}

	return s
}

func (s *subscriptionService) Forward(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error) {
	return s.forward(ctx, body, headers)
}
