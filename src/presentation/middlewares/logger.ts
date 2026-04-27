import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware.
 * Logs method, path, status, duration, requestId, userId, and IP for every request.
 * Uses structured logging format.
 * 
 * @returns Express middleware function
 */
export function loggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Extract request information
    const method = req.method;
    const path = req.path;
    const url = req.url;
    
    // Get user ID from auth middleware (if present)
    const userId = req.userId || 'anonymous';
    
    // Get client IP (respect x-forwarded-for header for proxies)
    let clientIp = req.ip;
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      if (typeof xForwardedFor === 'string') {
        // Take the first IP in the chain
        clientIp = xForwardedFor.split(',')[0].trim();
      } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
        clientIp = xForwardedFor[0].split(',')[0].trim();
      }
    }
    
    // Get request ID if present
    const requestId = req.headers['x-request-id'] || req.headers['X-Request-Id'];
    
    // Get user agent
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Log request start
    console.log(
      `[REQUEST] ${method} ${path} | User: ${userId} | IP: ${clientIp} | UA: ${userAgent}` +
      (requestId ? ` | Request-ID: ${requestId}` : '')
    );
    
    // Listen for response finish to log completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      console.log(
        `[RESPONSE] ${method} ${path} | Status: ${statusCode} | Duration: ${duration}ms`
      );
    });
    
    next();
  };
}