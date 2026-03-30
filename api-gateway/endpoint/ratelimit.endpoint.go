package endpoint

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/go-kit/kit/endpoint"
	kitlog "github.com/go-kit/log"
	"github.com/huzaifa678/SAAS-services/throttling"
	"github.com/redis/go-redis/v9"
)

type RedisRateLimiter struct {
	redisClient *redis.Client
	rps         int           
	burst       int           
	keyPrefix   string
	logger      kitlog.Logger
	maxMemoryUsage float64
}

func RateLimitMiddleware(redisClient *redis.Client, rps int, burst int, keyPrefix string, logger kitlog.Logger) endpoint.Middleware {
	limiter := &RedisRateLimiter{
		redisClient: redisClient,
		rps:         rps,
		burst:       burst,
		keyPrefix:   keyPrefix,
		logger:      logger,
		maxMemoryUsage: 0.8, // 80% memory usage threshold
	}

	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (interface{}, error) {
			userID, _ := ctx.Value("userId").(string)
			if userID == "" {
				userID = "anonymous"
			}

			pressure, err := throttling.IsStorageUnderPressure(ctx, limiter.redisClient, limiter.maxMemoryUsage)
			if err != nil {
				_ = limiter.logger.Log(
					"msg", "storage check failed",
					"err", err,
				)
			}

			if pressure {
				_ = limiter.logger.Log(
					"msg", "storage under pressure - throttling",
					"userID", userID,
				)

				return nil, errors.New("service busy (storage pressure)")
			}

			key := fmt.Sprintf("%s:%s", limiter.keyPrefix, userID)
			allowed, err := limiter.Allow(ctx, key)
			if err != nil {
				_ = limiter.logger.Log(
					"msg", "rate limiter error",
					"userID", userID,
					"key", key,
					"err", err,
				)
				return nil, err
			}

			if !allowed {
				_ = limiter.logger.Log(
					"msg", "rate limit exceeded",
					"userID", userID,
					"key", key,
					"rps", limiter.rps,
					"burst", limiter.burst,
				)
				return nil, errors.New("rate limit exceeded")
			}

			_ = limiter.logger.Log(
				"msg", "rate limit allowed",
				"userID", userID,
				"key", key,
			)

			return next(ctx, request)
		}
	}
}

func (r *RedisRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	ttl := time.Second

	script := `
	local current = redis.call("INCR", KEYS[1])
	if current == 1 then
		redis.call("EXPIRE", KEYS[1], ARGV[1])
	end
	if current > tonumber(ARGV[2]) then
		return 0
	end
	return 1
	`
	res, err := r.redisClient.Eval(ctx, script, []string{key}, int(ttl.Seconds()), r.burst).Int()
	if err != nil {
		return false, err
	}

	return res == 1, nil
}