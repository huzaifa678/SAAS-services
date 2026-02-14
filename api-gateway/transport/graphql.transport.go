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

	headers := map[string][]string{}
	for k, v := range r.Header {
		headers[k] = v
	}

	return endpoint.ForwardRequest{
		Body:   body,
		Header: headers,
		Path: r.URL.Path,
		Method: r.Method,
		Context: r.Context(),
	}, nil
}

func EncodeGraphQLResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	resp := response.(endpoint.ForwardResponse)
	if resp.Error != "" {
		http.Error(w, resp.Error, http.StatusServiceUnavailable)
		return nil
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.Status)
	_, err := w.Write(resp.Body)
	return err
}

func NewGraphQLHTTPHandler(endpoint kitendpoint.Endpoint) http.Handler {
	return kithttp.NewServer(
		endpoint,
		DecodeGraphQLRequest,
		EncodeGraphQLResponse,
	)
}
