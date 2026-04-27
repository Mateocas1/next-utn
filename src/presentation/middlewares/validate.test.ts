import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validate';

describe('validate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn();
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: sendMock,
    };
    mockNext = jest.fn();
  });

  describe('body validation', () => {
    const userSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    it('should call next() when body is valid', () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      
      const middleware = validate(userSchema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors when body is invalid', () => {
      mockReq.body = { email: 'invalid-email', password: '123' };
      
      const middleware = validate(userSchema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Array),
      });
    });

    it('should handle missing required fields', () => {
      mockReq.body = { email: 'test@example.com' }; // missing password
      
      const middleware = validate(userSchema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errorCode: 'VALIDATION_ERROR',
      }));
    });
  });

  describe('query validation', () => {
    const paginationSchema = z.object({
      limit: z.coerce.number().int().positive().max(100).optional(),
      cursor: z.string().optional(),
    });

    it('should call next() when query params are valid', () => {
      mockReq.query = { limit: '10', cursor: 'abc123' };
      
      const middleware = validate(paginationSchema, 'query');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should coerce string numbers to numbers', () => {
      mockReq.query = { limit: '25' };
      
      const middleware = validate(paginationSchema, 'query');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // The validated value should be a number after coercion
      expect(mockReq.query?.limit).toBe(25); // Zod coerces string to number
    });

    it('should return 400 when query params exceed max', () => {
      mockReq.query = { limit: '150' }; // exceeds max 100
      
      const middleware = validate(paginationSchema, 'query');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('params validation', () => {
    const idSchema = z.object({
      id: z.string().uuid(),
    });

    it('should call next() when params are valid', () => {
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      
      const middleware = validate(idSchema, 'params');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 400 when params are invalid', () => {
      mockReq.params = { id: 'not-a-uuid' };
      
      const middleware = validate(idSchema, 'params');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('default validation source (body)', () => {
    const schema = z.object({
      name: z.string(),
    });

    it('should validate body by default', () => {
      mockReq.body = { name: 'Test' };
      
      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when body is invalid by default', () => {
      mockReq.body = { name: 123 }; // wrong type
      
      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('error response format', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    it('should include field-level error details', () => {
      mockReq.body = { email: 'invalid' };
      
      const middleware = validate(schema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const responseCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.details).toBeDefined();
      expect(responseCall.details[0]).toMatchObject({
        field: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});