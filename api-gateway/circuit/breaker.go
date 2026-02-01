package circuit

import (
	"context"
	"errors"
	"time"

	"github.com/sony/gobreaker"
	"github.com/huzaifa678/SAAS-services/utils"
)

func WrapWithBreaker(fn func(ctx context.Context) (interface{}, error), cfg utils.CircuitBreakerConfig) func(ctx context.Context) (interface{}, error) {
	cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:    "AuthServiceBreaker",
		Timeout: time.Duration(cfg.TimeoutMs) * time.Millisecond,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures >= uint32(cfg.ErrorThreshold)
		},
		Interval: time.Duration(cfg.ResetTimeoutMs) * time.Millisecond,
	})

	return func(ctx context.Context) (interface{}, error) {
		res, err := cb.Execute(func() (interface{}, error) {
			r, e := fn(ctx)
			if e != nil {
				return nil, e
			}
			return r, nil
		})
		if err != nil {
			return nil, errors.New("auth service unavailable")
		}
		return res, nil
	}
}
