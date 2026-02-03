package endpoint

import (

	"github.com/go-kit/kit/endpoint"
	"github.com/go-kit/kit/ratelimit"
	"golang.org/x/time/rate"
)

func RateLimitMiddleware(rps int, burst int) endpoint.Middleware {
	limiter := rate.NewLimiter(rate.Limit(rps), burst)
	return ratelimit.NewErroringLimiter(limiter)
}
