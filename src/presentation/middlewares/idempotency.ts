import { Request, Response, NextFunction } from 'express';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { errorResponse } from '@presentation/utils/response';
import crypto from 'crypto';

/**
 * Idempotency middleware factory.
 * Creates middleware that handles idempotency keys for POST endpoints.
 * 
 * @param idempotencyStore - IdempotencyStore implementation (e.g., RedisIdempotencyStore)
 * @param ttlSeconds - Time-to-live for stored responses in seconds (default: 24 hours)
 * @returns Express middleware function
 */
export function idempotencyMiddleware(
  idempotencyStore: IdempotencyStore,
  ttlSeconds: number = 86400
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to POST requests
    if (req.method !== 'POST') {
      next();
      return;
    }

    try {
      // Get idempotency key from headers (case-insensitive)
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
      
      // Skip if no idempotency key
      if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        next();
        return;
      }

      // Create a unique key combining user, idempotency key, and endpoint
      const userId = req.userId || 'anonymous';
      const endpoint = req.path;
      const storeKey = `${userId}:${idempotencyKey}:${endpoint}`;

      // Generate hash of request body for conflict detection
      const bodyHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(req.body || {}))
        .digest('hex');

      // Check if we have a cached response
      const cachedResponse = await idempotencyStore.get(storeKey);
      
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        
        // Verify the cached response includes the body hash we stored
        if (parsed._idempotencyBodyHash === bodyHash) {
          // Return cached response
          delete parsed._idempotencyBodyHash; // Remove internal field before sending
          res.json(parsed);
          return;
        } else {
          // Body hash mismatch - conflict
          res.status(409).json(
            errorResponse(
              'Idempotency key conflict',
              'IDEMPOTENCY_KEY_CONFLICT'
            )
          );
          return;
        }
      }

      // No cached response - proceed with request
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override res.json to capture and store the response
      res.json = function(body: any) {
        // Add body hash to response for future conflict detection
        const responseToStore = {
          ...body,
          _idempotencyBodyHash: bodyHash,
        };
        
        // Store response asynchronously (don't wait for it)
        idempotencyStore.set(storeKey, JSON.stringify(responseToStore), ttlSeconds)
          .catch(err => {
            console.error('Failed to store idempotency response:', err);
          });
        
        // Remove internal field before sending to client
        delete responseToStore._idempotencyBodyHash;
        
        // Call original json method
        return originalJson(responseToStore);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}