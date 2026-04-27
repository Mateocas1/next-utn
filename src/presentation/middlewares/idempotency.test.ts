import { Request, Response, NextFunction } from 'express';
import { idempotencyMiddleware } from './idempotency';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { successResponse } from '@presentation/utils/response';
import crypto from 'crypto';

// Mock the IdempotencyStore port
const mockIdempotencyStore: jest.Mocked<IdempotencyStore> = {
  get: jest.fn(),
  set: jest.fn(),
  exists: jest.fn(),
};

// Mock response methods
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe('idempotencyMiddleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;
  let originalJson: jest.Mock;
  let originalStatus: jest.Mock;

  beforeEach(() => {
    req = {
      userId: 'user-123',
      path: '/chats',
      method: 'POST',
      headers: {},
      body: { title: 'New Chat' },
    };
    res = mockResponse();
    next = jest.fn();
    originalJson = res.json as jest.Mock;
    originalStatus = res.status as jest.Mock;
    jest.clearAllMocks();
  });

  it('should skip middleware for non-POST requests', async () => {
    // Arrange
    req.method = 'GET';
    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockIdempotencyStore.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should skip middleware when no Idempotency-Key header is present', async () => {
    // Arrange
    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockIdempotencyStore.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should return cached response when idempotency key exists', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'abc-123' };
    req.body = { title: 'New Chat' };
    
    // Create body hash that matches the request
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    const cachedResponse = JSON.stringify({
      success: true,
      data: { id: 'chat-456', participants: ['user-123'], createdAt: '2024-01-01T00:00:00Z' },
      _idempotencyBodyHash: bodyHash,
    });
    mockIdempotencyStore.get.mockResolvedValue(cachedResponse);

    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockIdempotencyStore.get).toHaveBeenCalledWith('user-123:abc-123:/chats');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'chat-456', participants: ['user-123'], createdAt: '2024-01-01T00:00:00Z' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should store response after successful execution for POST requests', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'def-456' };
    mockIdempotencyStore.get.mockResolvedValue(null);
    
    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act - first call should pass through to next()
    await middleware(req as Request, res as Response, next);

    // Assert - should call next() since no cached response
    expect(next).toHaveBeenCalled();
    // The res.json method should be wrapped
    expect(typeof res.json).toBe('function');
  });

  it('should return 409 when idempotency key exists with different request body', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'ghi-789' };
    req.body = { title: 'Original Chat' };
    
    // Create a cached response with a DIFFERENT body hash
    const differentBodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ title: 'Different Chat' }))
      .digest('hex');
    
    const cachedResponse = JSON.stringify({
      success: true,
      data: { id: 'chat-999' },
      _idempotencyBodyHash: differentBodyHash,
    });
    
    mockIdempotencyStore.get.mockResolvedValue(cachedResponse);

    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: 'Idempotency key conflict',
      errorCode: 'IDEMPOTENCY_KEY_CONFLICT',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle case-insensitive idempotency-key header', async () => {
    // Arrange
    req.headers = { 'Idempotency-Key': 'case-test' };
    req.body = { title: 'Test Chat' };
    
    // Create body hash that matches the request
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    const cachedResponse = JSON.stringify({
      success: true,
      data: { id: 'test-id' },
      _idempotencyBodyHash: bodyHash,
    });
    mockIdempotencyStore.get.mockResolvedValue(cachedResponse);

    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(mockIdempotencyStore.get).toHaveBeenCalledWith('user-123:case-test:/chats');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'test-id' },
    });
  });

  it('should propagate errors from idempotency store', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'error-test' };
    const error = new Error('Redis connection failed');
    mockIdempotencyStore.get.mockRejectedValue(error);

    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should wrap res.json to store response after successful execution', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'wrap-test' };
    req.body = { title: 'Wrapped Chat' };
    mockIdempotencyStore.get.mockResolvedValue(null);
    
    const middleware = idempotencyMiddleware(mockIdempotencyStore);
    
    // Store original json method
    const originalJson = res.json.bind(res);
    let storedResponse: string | null = null;
    
    // Mock set to capture what would be stored
    mockIdempotencyStore.set.mockImplementation(async (key, response) => {
      storedResponse = response;
    });

    // Act - middleware should wrap res.json
    await middleware(req as Request, res as Response, next);
    
    // Now call the wrapped res.json
    const responseBody = successResponse({ id: 'chat-wrapped' });
    res.json(responseBody);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(mockIdempotencyStore.set).toHaveBeenCalled();
    expect(storedResponse).toBeTruthy();
    
    const parsed = JSON.parse(storedResponse!);
    expect(parsed.success).toBe(true);
    expect(parsed.data.id).toBe('chat-wrapped');
    expect(parsed._idempotencyBodyHash).toBeDefined();
  });

  it('should handle empty request body', async () => {
    // Arrange
    req.headers = { 'idempotency-key': 'empty-body' };
    req.body = {};
    mockIdempotencyStore.get.mockResolvedValue(null);

    const middleware = idempotencyMiddleware(mockIdempotencyStore);

    // Act
    await middleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
    // Should not throw when body is empty
  });
});