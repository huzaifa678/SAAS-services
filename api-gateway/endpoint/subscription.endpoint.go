package endpoint

import (
	"context"

	"github.com/go-kit/kit/endpoint"
	"github.com/huzaifa678/SAAS-services/service"
)

func MakeSubscriptionEndpoint(s service.SubscriptionService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(GraphQLRequest)

		body, status, err := s.Forward(ctx, req.Body, req.Header)
		if err != nil {
			return GraphQLResponse{
				Error:  err.Error(),
				Status: status,
			}, nil
		}

		return GraphQLResponse{
			Body:   body,
			Status: status,
		}, nil
	}
}
