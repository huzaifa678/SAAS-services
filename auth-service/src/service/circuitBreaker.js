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

  breaker.on('open', () => logger.info('breaker open')) 
  breaker.on('halfOpen', () => logger.info('breaker halfopen')) 
  breaker.on('closed', () => logger.info('breaker closed')) 
  return breaker;
}