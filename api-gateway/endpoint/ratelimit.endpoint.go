package endpoint

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/go-kit/kit/endpoint"
	"github.com/redis/go-redis/v9"
	kitlog "github.com/go-kit/log"
)

type RedisRateLimiter struct {
	redisClient *redis.Client
	rps         int           
	burst       int           
	keyPrefix   string
	logger      kitlog.Logger
}

func RateLimitMiddleware(redisClient *redis.Client, rps int, burst int, keyPrefix string, logger kitlog.Logger) endpoint.Middleware {
	limiter := &RedisRateLimiter{
		redisClient: redisClient,
		rps:         rps,
		burst:       burst,
		keyPrefix:   keyPrefix,
		logger:      logger,
	}

	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (interface{}, error) {
			userID, _ := ctx.Value("userId").(string)
			if userID == "" {
				userID = "anonymous"
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