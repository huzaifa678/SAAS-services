package service

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"

	kithttp "github.com/go-kit/kit/transport/http"

	"github.com/huzaifa678/SAAS-services/utils"
	"github.com/huzaifa678/SAAS-services/circuit"
)

type AuthService interface {
	Forward(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error)
}

type authService struct {
	forward func(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error)
}

func NewAuthService(baseURL string, cbCfg utils.CircuitBreakerConfig) AuthService {
	s := &authService{}

	u := mustParseURL(baseURL)

	client := kithttp.NewClient(
		"POST",
		u,
		encodeGraphQLRequest,
		decodeGraphQLResponse,
	).Endpoint()

	wrapped := circuit.WrapWithBreaker(func(ctx context.Context) (interface{}, error) {
		v := ctx.Value("graphqlRequest")
		if v == nil {
			return nil, errors.New("no request in context")
		}

		req := v.(struct {
			Body   []byte
			Header http.Header
		})

		resp, err := client(ctx, req)
		if err != nil {
			return nil, err
		}

		return resp, nil
	}, cbCfg)

	s.forward = func(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error) {
		ctx = context.WithValue(ctx, "graphqlRequest", struct {
			Body   []byte
			Header http.Header
		}{body, headers})

		res, err := wrapped(ctx)
		if err != nil {
			return nil, 0, err
		}

		r := res.(struct {
			Body   []byte
			Status int
		})
		return r.Body, r.Status, nil
	}

	return s
}

func (s *authService) Forward(ctx context.Context, body []byte, headers http.Header) ([]byte, int, error) {
	return s.forward(ctx, body, headers)
}

func mustParseURL(u string) *url.URL {
	parsed, err := url.Parse(u)
	if err != nil {
		panic(err)
	}
	return parsed
}

func encodeGraphQLRequest(_ context.Context, req *http.Request, request interface{}) error {
	r := request.(struct {
		Body   []byte
		Header http.Header
	})

	req.Body = io.NopCloser(bytes.NewReader(r.Body))
	req.Header.Set("Content-Type", "application/json")
	for k, v := range r.Header {
		for _, val := range v {
			req.Header.Add(k, val)
		}
	}
	return nil
}

func decodeGraphQLResponse(_ context.Context, resp *http.Response) (interface{}, error) {
	b, _ := io.ReadAll(resp.Body)
	return struct {
		Body   []byte
		Status int
	}{b, resp.StatusCode}, nil
}
