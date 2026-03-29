import CircuitBreaker from 'opossum';
import logger from '../../logger.js' 

export function createBreaker(fn, options = {}) {
  const defaultOptions = {
    timeout: 5000,      
    errorThresholdPercentage: 50, 
    resetTimeout: 10000, 
  };
  
  const { fallback, ...breakerOptions } = options;
  const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...breakerOptions });

  if (fallback) {
    breaker.fallback(fallback);
  }

  breaker.on('open', () => logger.warn('Circuit breaker opened', { 
      error: e.message,
      path: req.path,
      service: 'auth-service' // Extra label
    })); 
  breaker.on('halfOpen', () => logger.info('Circuit breaker halfopen', {
      error: e.message,
      path: req.path,
      service: 'auth-service'
  })); 
  breaker.on('closed', () => logger.info('Circuit breaker closed', { 
      error: e.message,
      path: req.path,
      service: 'auth-service'
  })); 
  return breaker;
}