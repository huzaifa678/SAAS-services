package transport

import (
	"context"
	"io"
	"net/http"

	kitendpoint "github.com/go-kit/kit/endpoint"
	kithttp "github.com/go-kit/kit/transport/http"
	"github.com/huzaifa678/SAAS-services/endpoint"
)

func DecodeRESTRequest(_ context.Context, r *http.Request) (interface{}, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	return endpoint.ForwardRequest{
		Body:   body,
		Header: r.Header,
	}, nil
}

func EncodeRESTRequest(_ context.Context, w http.ResponseWriter, response interface{}) error {
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

func NewRESTHTTPHandler(endpoint kitendpoint.Endpoint) http.Handler {
	return kithttp.NewServer(
		endpoint,
		DecodeRESTRequest,
		EncodeRESTRequest,
	)
}