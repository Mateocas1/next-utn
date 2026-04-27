import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

type ValidationSource = 'body' | 'query' | 'params';

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  source: ValidationSource = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`validate middleware called for ${source}`);
    try {
      const data = source === 'body' 
        ? req.body 
        : source === 'query'
        ? req.query
        : req.params;

      console.log(`validate middleware data:`, data);
      const validated = schema.parse(data);
      console.log(`validate middleware validated:`, validated);
      
      // Replace the request data with validated values
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        // Clear and rebuild query object since req.query is read-only
        // We need to delete existing properties and add validated ones
        const queryObj = req.query;
        // Delete all existing properties
        Object.keys(queryObj).forEach(key => {
          delete queryObj[key];
        });
        // Add validated properties
        Object.assign(queryObj, validated);
      } else {
        // Type assertion needed for Express params type
        req.params = validated as any;
      }

      next();
    } catch (error) {
      console.error(`validate middleware error:`, error);
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json(
          errorResponse('Validation failed', 'VALIDATION_ERROR', details)
        );
        return;
      }

      // Unexpected error
      res.status(500).json(
        errorResponse('Internal server error', 'INTERNAL_ERROR')
      );
    }
  };
}