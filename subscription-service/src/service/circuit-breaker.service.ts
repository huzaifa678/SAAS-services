import { Injectable, Logger } from "@nestjs/common";
import CircuitBreaker from 'opossum';


@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);

    create<T extends (...args: any[]) => Promise<any>>(
        action: T,
        options?: CircuitBreaker.options,
    ): CircuitBreaker {
        const defaultOptions: CircuitBreaker.options = {
            timeout: 5000,
            errorThresholdPercentage: 50,
            resetTimeout: 10000,
            rollingCountTimeout: 10000, 
            rollingCountBuckets: 10,
        };

        const breaker = new CircuitBreaker(action, { ...defaultOptions, ...options });

        breaker.fallback(() => {
            this.logger.warn('Circuit breaker fallback triggered');
            return null;
        });

        breaker.on('open', () => this.logger.warn('Circuit breaker OPEN'));
        breaker.on('halfOpen', () => this.logger.log('Circuit breaker HALF-OPEN'));
        breaker.on('close', () => this.logger.log('Circuit breaker CLOSED'));
        breaker.on('failure', (err) => this.logger.error('Circuit breaker FAILURE', err));

        return breaker;
    }
}