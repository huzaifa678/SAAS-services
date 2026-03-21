package endpoint

import (
	"context"
	"time"

	"github.com/go-kit/kit/endpoint"
	kitlog "github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"go.opentelemetry.io/otel/trace"
)

func LoggingMiddleware(logger kitlog.Logger) endpoint.Middleware {
	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (response interface{}, err error) {
			begin := time.Now()
			resp, e := next(ctx, request)

			var traceID string
			if span := trace.SpanFromContext(ctx); span != nil {
				traceID = span.SpanContext().TraceID().String()
			}

			level.Info(logger).Log(
				"msg", "endpoint called",
				"took", time.Since(begin).String(),
				"err", err,
				"trace_id", traceID,
			)

			return resp, e
		}
	}
}