import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '@domain/errors/DomainError';
import { errorResponse } from '../utils/response';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error with request context
  const logContext = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    console.error(
      `[400] VALIDATION_ERROR: Validation failed`,
      logContext,
      details
    );

    res.status(400).json(
      errorResponse('Validation failed', 'VALIDATION_ERROR', details)
    );
    return;
  }

  // Handle DomainErrors (our custom errors)
  if (error instanceof DomainError) {
    console.error(
      `[${error.statusCode}] ${error.errorCode}: ${error.message}`,
      logContext,
      error.stack
    );

    res.status(error.statusCode).json(
      errorResponse(error.message, error.errorCode)
    );
    return;
  }

  // Handle generic Errors
  if (error instanceof Error) {
    console.error(
      `[500] INTERNAL_ERROR: ${error.message}`,
      logContext,
      error.stack
    );

    res.status(500).json(
      errorResponse('Internal server error', 'INTERNAL_ERROR')
    );
    return;
  }

  // Handle unknown error types
  console.error(
    `[500] INTERNAL_ERROR: Unknown error`,
    logContext,
    error
  );

  res.status(500).json(
    errorResponse('Internal server error', 'INTERNAL_ERROR')
  );
}