import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '@application/ports/RateLimiter';
import { errorResponse } from '@presentation/utils/response';

/**
 * Rate limiting middleware factory.
 * Creates middleware that enforces rate limits using the provided RateLimiter.
 * 
 * @param rateLimiter - RateLimiter implementation (e.g., RedisRateLimiter)
 * @returns Express middleware function
 */
export function rateLimiterMiddleware(rateLimiter: RateLimiter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use userId from auth middleware, fallback to 'anonymous' for unauthenticated requests
      const userId = req.userId || 'anonymous';
      
      // Construct endpoint identifier: "METHOD /path"
      const endpoint = `${req.method} ${req.path}`;
      
      // Check rate limit
      const result = await rateLimiter.check(userId, endpoint);
      
      // Set rate limit headers on all responses
      res.setHeader('X-RateLimit-Limit', 100); // Default from RedisRateLimiter
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt);
      
      if (!result.allowed) {
        // Calculate Retry-After in seconds
        const now = Math.floor(Date.now() / 1000);
        const retryAfter = Math.max(1, result.resetAt - now);
        
        res.setHeader('Retry-After', retryAfter);
        res.status(429).json(
          errorResponse(
            'Rate limit exceeded',
            'RATE_LIMIT_EXCEEDED'
          )
        );
        return;
      }
      
      // Rate limit not exceeded, continue to next middleware/route
      next();
    } catch (error) {
      // Propagate errors (e.g., Redis connection issues)
      next(error);
    }
  };
}