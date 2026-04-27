import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '@domain/errors/DomainError';
import { JWTService } from '@infrastructure/auth/JWTService';
import { authMiddleware } from './auth';

// Mock JWTService
jest.mock('@infrastructure/auth/JWTService');

describe('authMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJWTService: jest.Mocked<JWTService>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    // Create fresh mock for each test
    mockJWTService = {
      sign: jest.fn(),
      verify: jest.fn(),
      secret: 'test-secret',
      expiresIn: '1h',
    } as unknown as jest.Mocked<JWTService>;
  });

  it('should call next() with userId when valid token is provided', async () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };
    mockJWTService.verify.mockResolvedValue({ userId: 'user-123' });

    const middleware = authMiddleware(mockJWTService);
    
    // Call middleware
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('valid-token');
    expect(mockReq.userId).toBe('user-123');
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 401 with AUTHENTICATION_REQUIRED when no authorization header', () => {
    mockReq.headers = {}; // No authorization header

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockJWTService.verify).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Authentication required',
      errorCode: 'AUTHENTICATION_REQUIRED',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with AUTHENTICATION_REQUIRED when authorization header is malformed', () => {
    mockReq.headers = { authorization: 'InvalidFormat' }; // Missing "Bearer "

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockJWTService.verify).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Authentication required',
      errorCode: 'AUTHENTICATION_REQUIRED',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with TOKEN_EXPIRED when token is expired', async () => {
    mockReq.headers = { authorization: 'Bearer expired-token' };
    mockJWTService.verify.mockRejectedValue(
      new AuthenticationError('Token expired', 'TOKEN_EXPIRED')
    );

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('expired-token');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Token expired',
      errorCode: 'TOKEN_EXPIRED',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with INVALID_TOKEN when token is invalid', async () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };
    mockJWTService.verify.mockRejectedValue(
      new AuthenticationError('Invalid token', 'INVALID_TOKEN')
    );

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('invalid-token');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Invalid token',
      errorCode: 'INVALID_TOKEN',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 with generic authentication error for other JWT errors', async () => {
    mockReq.headers = { authorization: 'Bearer bad-token' };
    mockJWTService.verify.mockRejectedValue(
      new AuthenticationError('Authentication failed')
    );

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('bad-token');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Authentication failed',
      errorCode: 'AUTHENTICATION_ERROR',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle case-insensitive authorization header', async () => {
    mockReq.headers = { Authorization: 'Bearer valid-token' }; // Capital A
    mockJWTService.verify.mockResolvedValue({ userId: 'user-123' });

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('valid-token');
    expect(mockReq.userId).toBe('user-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle extra whitespace in authorization header', async () => {
    mockReq.headers = { authorization: '  Bearer   valid-token   ' };
    mockJWTService.verify.mockResolvedValue({ userId: 'user-123' });

    const middleware = authMiddleware(mockJWTService);
    
    middleware(mockReq as Request, mockRes as Response, mockNext);

    // Wait for promise to resolve
    await new Promise(process.nextTick);

    expect(mockJWTService.verify).toHaveBeenCalledWith('valid-token');
    expect(mockReq.userId).toBe('user-123');
    expect(mockNext).toHaveBeenCalled();
  });
});