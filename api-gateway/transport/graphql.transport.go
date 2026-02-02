package transport

import (
	"context"
	"io"
	"net/http"

	kithttp "github.com/go-kit/kit/transport/http"
	kitendpoint "github.com/go-kit/kit/endpoint"
	"github.com/huzaifa678/SAAS-services/endpoint"
)

func DecodeGraphQLRequest(_ context.Context, r *http.Request) (interface{}, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}

	return endpoint.GraphQLRequest{
		Body:   body,
		Header: r.Header,
	}, nil
}

func EncodeGraphQLResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	resp := response.(endpoint.GraphQLResponse)
	if resp.Error != "" {
		http.Error(w, resp.Error, http.StatusServiceUnavailable)
		return nil
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.Status)
	_, err := w.Write(resp.Body)
	return err
}

func NewGraphQLHTTPHandler(authEndpoint kitendpoint.Endpoint) http.Handler {
	return kithttp.NewServer(
		authEndpoint,
		DecodeGraphQLRequest,
		EncodeGraphQLResponse,
	)
}
