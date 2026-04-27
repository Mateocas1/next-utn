import { Request, Response, NextFunction } from 'express';
import { rateLimiterMiddleware } from './rateLimiter';
import { RateLimiter } from '@application/ports/RateLimiter';
import { successResponse } from '@presentation/utils/response';

// Mock the RateLimiter port
const mockRateLimiter: jest.Mocked<RateLimiter> = {
  check: jest.fn(),
};

// Mock response methods
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe('rateLimiterMiddleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      userId: 'user-123',
      path: '/messages',
      method: 'POST',
    };
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow request when rate limit is not exceeded', async () => {
    // Arrange
    mockRateLimiter.check.mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockRateLimiter.check).toHaveBeenCalledWith('user-123', 'POST /messages');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 49);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    expect(next).toHaveBeenCalled();
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Arrange
    const resetAt = Math.floor(Date.now() / 1000) + 30;
    mockRateLimiter.check.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockRateLimiter.check).toHaveBeenCalledWith('user-123', 'POST /messages');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 30);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Rate limit exceeded',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unauthenticated requests (no userId)', async () => {
    // Arrange
    req.userId = undefined;
    mockRateLimiter.check.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockRateLimiter.check).toHaveBeenCalledWith('anonymous', 'POST /messages');
    expect(next).toHaveBeenCalled();
  });

  it('should handle different endpoints separately', async () => {
    // Arrange
    req = {
      userId: 'user-123',
      path: '/chats',
      method: 'GET',
    };
    mockRateLimiter.check.mockResolvedValue({
      allowed: true,
      remaining: 75,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockRateLimiter.check).toHaveBeenCalledWith('user-123', 'GET /chats');
    expect(next).toHaveBeenCalled();
  });

  it('should propagate errors from rate limiter', async () => {
    // Arrange
    const error = new Error('Redis connection failed');
    mockRateLimiter.check.mockRejectedValue(error);

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should calculate Retry-After header correctly when rate limit exceeded', async () => {
    // Arrange
    const now = Math.floor(Date.now() / 1000);
    const resetAt = now + 30; // 30 seconds from now
    mockRateLimiter.check.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 30);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should ensure Retry-After is at least 1 second', async () => {
    // Arrange
    const now = Math.floor(Date.now() / 1000);
    const resetAt = now - 5; // Already expired (5 seconds ago)
    mockRateLimiter.check.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt,
    });

    const middleware = rateLimiterMiddleware(mockRateLimiter);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 1);
  });
});