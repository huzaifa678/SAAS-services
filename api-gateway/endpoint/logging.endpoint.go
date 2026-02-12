package endpoint

import (
	"context"
	"time"

	"github.com/go-kit/kit/endpoint"
	kitlog "github.com/go-kit/log"
	"github.com/go-kit/log/level"
)

func LoggingMiddleware(logger kitlog.Logger) endpoint.Middleware {
	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (response interface{}, err error) {
			defer func(begin time.Time) {
				level.Info(logger).Log(
					"msg", "endpoint called",
					"took", time.Since(begin),
					"err", err,
				)
			}(time.Now())

			return next(ctx, request)
		}
	}
}