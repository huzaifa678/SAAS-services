import CircuitBreaker from 'opossum';

export function createBreaker(fn, options = {}) {
  const defaultOptions = {
    timeout: 5000,      
    errorThresholdPercentage: 50, 
    resetTimeout: 10000, 
  };
  
  const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });

  breaker.fallback(() => {
    return { error: 'Service temporarily unavailable. Please try again later.' };
  });

  breaker.on('open', () => console.warn('Circuit breaker opened!'));
  breaker.on('halfOpen', () => console.log('Circuit breaker half-open, testing service...'));
  breaker.on('close', () => console.log('Circuit breaker closed, service healthy again.'));

  return breaker;
}