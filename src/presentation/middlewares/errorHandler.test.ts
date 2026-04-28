import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError, AuthenticationError, NotFoundError, ValidationError } from '@domain/errors/DomainError';
import { errorHandler } from './errorHandler';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle DomainError with custom status code', () => {
    const error = new NotFoundError('User');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'User not found',
      errorCode: 'NOT_FOUND',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[404] NOT_FOUND: User not found'),
      expect.any(Object),
      expect.any(String)
    );
  });

  it('should handle AuthenticationError with 401 status', () => {
    const error = new AuthenticationError('Invalid credentials');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Invalid credentials',
      errorCode: 'AUTHENTICATION_FAILED',
    });
  });

  it('should handle ValidationError with 400 status', () => {
    const error = new ValidationError('Email is invalid');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Email is invalid',
      errorCode: 'VALIDATION_ERROR',
    });
  });

  it('should handle ZodError with 400 status and details', () => {
  // Create a ZodError using a schema to get proper error structure
  import { z } from 'zod';
  const schema = z.object({
      email: z.string(),
      password: z.string().min(8),
    });
    
    let zodError;
    try {
      schema.parse({ email: 123, password: '123' });
    } catch (err) {
      zodError = err;
    }

    errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    const response = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.message).toBe('Validation failed');
    expect(response.errorCode).toBe('VALIDATION_ERROR');
    expect(response.details).toHaveLength(2);
    expect(response.details[0]).toMatchObject({
      field: 'email',
      message: expect.stringContaining('string'),
    });
  });

  it('should handle generic Error with 500 status', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[500] INTERNAL_ERROR: Something went wrong'),
      expect.any(Object),
      expect.any(String)
    );
  });

  it('should handle non-Error objects with 500 status', () => {
    const error = { custom: 'error object' };

    errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[500] INTERNAL_ERROR: Unknown error'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should log request details for server errors', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // The logContext object contains the request details
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection failed'),
      expect.objectContaining({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
      }),
      expect.any(String)
    );
  });

  it('should not expose internal error details to client for generic errors', () => {
    const error = new Error('Database connection failed: Connection refused');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    // Client should get generic message
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Internal server error', // Generic, not the actual error message
      errorCode: 'INTERNAL_ERROR',
    });
    // But server logs should have full details
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection failed: Connection refused'),
      expect.any(Object),
      expect.any(String)
    );
  });

  it('should handle string errors', () => {
    const error = 'String error message';

    errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  });

  it('should handle null/undefined errors', () => {
    errorHandler(undefined as any, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  });
});