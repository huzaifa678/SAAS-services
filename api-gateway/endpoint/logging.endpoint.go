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
		return func(ctx context.Context, request interface{}) (interface{}, error) {
			begin := time.Now()

			resp, err := next(ctx, request)

			var traceID, spanID string
			if span := trace.SpanFromContext(ctx); span != nil {
				sc := span.SpanContext()
				traceID = sc.TraceID().String()
				spanID = sc.SpanID().String()
			}

			level.Info(logger).Log(
				"msg", "endpoint called",
				"took", time.Since(begin).String(),
				"error", err,
				"trace_id", traceID,
				"span_id", spanID,
			)

			return resp, err
		}
	}
}