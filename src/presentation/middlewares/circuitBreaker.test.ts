import { Request, Response, NextFunction } from 'express';
import { circuitBreakerMiddleware } from './circuitBreaker';
import { mongoDBConnection } from '@infrastructure/database/connection';
import { redisConnection } from '@infrastructure/redis/connection';

// Mock response methods
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock the connection instances
jest.mock('@infrastructure/database/connection', () => ({
  mongoDBConnection: {
    getMetrics: jest.fn(),
  },
}));

jest.mock('@infrastructure/redis/connection', () => ({
  redisConnection: {
    getMetrics: jest.fn(),
  },
}));

const mockMongoDBConnection = require('@infrastructure/database/connection').mongoDBConnection;
const mockRedisConnection = require('@infrastructure/redis/connection').redisConnection;

describe('circuitBreakerMiddleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      path: '/messages',
      method: 'POST',
    };
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
    
    // Default mocks
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'CLOSED' });
    mockRedisConnection.getMetrics.mockReturnValue({ state: 'CLOSED' });
  });

  it('should allow request when all circuit breakers are CLOSED', () => {
    // Arrange
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 503 when MongoDB circuit breaker is OPEN', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Service unavailable',
      errorCode: 'SERVICE_UNAVAILABLE',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 503 when Redis circuit breaker is OPEN', () => {
    // Arrange
    mockRedisConnection.getMetrics.mockReturnValue({ state: 'OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Service unavailable',
      errorCode: 'SERVICE_UNAVAILABLE',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow request when circuit breaker is HALF_OPEN', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'HALF_OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should handle health check endpoint specially', () => {
    // Arrange
    req = {
      path: '/health',
      method: 'GET',
    };
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled(); // Health endpoint should bypass circuit breaker
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should handle errors when getting metrics', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockImplementation(() => {
      throw new Error('Failed to get metrics');
    });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Service unavailable',
      errorCode: 'SERVICE_UNAVAILABLE',
    });
  });

  it('should return 503 when both MongoDB and Redis circuits are OPEN', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'OPEN' });
    mockRedisConnection.getMetrics.mockReturnValue({ state: 'OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Service unavailable',
      errorCode: 'SERVICE_UNAVAILABLE',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle HALF_OPEN state for Redis while MongoDB is CLOSED', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'CLOSED' });
    mockRedisConnection.getMetrics.mockReturnValue({ state: 'HALF_OPEN' });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled(); // Should allow since HALF_OPEN is not OPEN
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should handle case where Redis metrics check throws but MongoDB is CLOSED', () => {
    // Arrange
    mockMongoDBConnection.getMetrics.mockReturnValue({ state: 'CLOSED' });
    mockRedisConnection.getMetrics.mockImplementation(() => {
      throw new Error('Redis metrics unavailable');
    });
    
    const middleware = circuitBreakerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503); // Should return 503 on error
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Service unavailable',
      errorCode: 'SERVICE_UNAVAILABLE',
    });
  });
});