import { Request, Response, NextFunction } from 'express';
import { mongoDBConnection } from '@infrastructure/database/connection';
import { redisConnection } from '@infrastructure/redis/connection';
import { errorResponse } from '@presentation/utils/response';

/**
 * Circuit breaker middleware.
 * Checks MongoDB and Redis circuit breaker states and returns 503 if either is OPEN.
 * Health check endpoint (/health) bypasses circuit breaker.
 * 
 * @returns Express middleware function
 */
export function circuitBreakerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Health endpoint should always be accessible
      if (req.path === '/health') {
        next();
        return;
      }

      // Check MongoDB circuit breaker
      const mongoMetrics = mongoDBConnection.getMetrics();
      if (mongoMetrics.state === 'OPEN') {
        res.status(503).json(
          errorResponse(
            'Service unavailable',
            'SERVICE_UNAVAILABLE'
          )
        );
        return;
      }

      // Check Redis circuit breaker
      const redisMetrics = redisConnection.getMetrics();
      if (redisMetrics.state === 'OPEN') {
        res.status(503).json(
          errorResponse(
            'Service unavailable',
            'SERVICE_UNAVAILABLE'
          )
        );
        return;
      }

      // Both circuit breakers are CLOSED or HALF_OPEN
      next();
    } catch (error) {
      // If we can't check circuit breakers, assume service is unavailable
      res.status(503).json(
        errorResponse(
          'Service unavailable',
          'SERVICE_UNAVAILABLE'
        )
      );
    }
  };
}