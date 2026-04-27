import { Request, Response, NextFunction } from 'express';
import { loggerMiddleware } from './logger';

// Mock console.log to capture logs
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock response methods
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  
  const mockRes = res as any;
  mockRes.finishCallback = null;
  
  res.on = jest.fn().mockImplementation((event: string, callback: Function) => {
    if (event === 'finish') {
      // Store callback to call later
      mockRes.finishCallback = callback;
    }
    return res;
  });
  return res;
};

describe('loggerMiddleware', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/messages',
      url: '/messages',
      headers: {
        'user-agent': 'TestAgent/1.0',
        'x-forwarded-for': '192.168.1.1',
      },
      ip: '127.0.0.1',
    };
    req.userId = 'user-123';
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should log request start and end with duration', () => {
    // Arrange
    const startTime = 1000;
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime) // Start time
      .mockReturnValueOnce(startTime + 150); // End time (150ms later)
    
    const middleware = loggerMiddleware();

    // Act - call middleware
    middleware(req as Request, res as Response, next);

    // Assert - should call next immediately
    expect(next).toHaveBeenCalled();
    
    // Simulate response finish event
    const finishCallback = (res as any).finishCallback;
    expect(finishCallback).toBeDefined();
    
    // Call finish callback (simulating response completion)
    finishCallback();

    // Assert logs
    expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    
    // First call should be request start
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('POST /messages');
    expect(firstCall).toContain('user-123');
    expect(firstCall).toContain('192.168.1.1'); // From x-forwarded-for header
    
    // Second call should be request end with duration
    const secondCall = mockConsoleLog.mock.calls[1][0];
    expect(secondCall).toContain('[RESPONSE]');
    expect(secondCall).toContain('POST /messages');
    expect(secondCall).toContain('150ms');
  });

  it('should include request ID if present', () => {
    // Arrange
    req.headers = { ...req.headers, 'x-request-id': 'req-abc-123' };
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('POST /messages');
    expect(firstCall).toContain('user-123');
    expect(firstCall).toContain('req-abc-123');
  });

  it('should handle requests without userId', () => {
    // Arrange
    delete req.userId;
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('POST /messages');
    expect(firstCall).toContain('anonymous');
  });

  it('should log response status code', () => {
    // Arrange
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    res.statusCode = 201;
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const secondCall = mockConsoleLog.mock.calls[1][0];
    expect(secondCall).toContain('[RESPONSE]');
    expect(secondCall).toContain('POST /messages');
    expect(secondCall).toContain('201');
    expect(secondCall).toContain('0ms'); // Duration will be 0 since we mocked Date.now
  });

  it('should handle different HTTP methods and paths', () => {
    // Arrange
    req = {
      method: 'GET',
      path: '/chats',
      url: '/chats?limit=20',
      headers: {
        'user-agent': 'TestAgent/1.0',
      },
      ip: '127.0.0.1',
    };
    req.userId = 'user-123';
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('GET /chats');
  });

  it('should handle real IP from x-forwarded-for header', () => {
    // Arrange
    req = {
      method: 'POST',
      path: '/messages',
      url: '/messages',
      headers: {
        'user-agent': 'TestAgent/1.0',
        'x-forwarded-for': '203.0.113.195, 70.41.3.18',
      },
      ip: '70.41.3.18',
    };
    req.userId = 'user-123';
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('POST /messages');
    expect(firstCall).toContain('203.0.113.195'); // Should use first IP from x-forwarded-for
  });

  it('should handle missing x-forwarded-for header', () => {
    // Arrange
    req = {
      method: 'POST',
      path: '/messages',
      url: '/messages',
      headers: {
        'user-agent': 'TestAgent/1.0',
      },
      ip: '192.168.1.100',
    };
    req.userId = 'user-123';
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('[REQUEST]');
    expect(firstCall).toContain('POST /messages');
    expect(firstCall).toContain('192.168.1.100');
  });

  it('should propagate errors if res.on throws', () => {
    // Arrange
    res.on = jest.fn().mockImplementation(() => {
      throw new Error('Event emitter error');
    });
    
    const middleware = loggerMiddleware();

    // Act & Assert
    expect(() => {
      middleware(req as Request, res as Response, next);
    }).toThrow('Event emitter error');
  });

  it('should handle array x-forwarded-for header', () => {
    // Arrange
    req = {
      method: 'POST',
      path: '/messages',
      url: '/messages',
      headers: {
        'user-agent': 'TestAgent/1.0',
        'x-forwarded-for': ['203.0.113.195, 70.41.3.18', 'another-proxy'],
      },
      ip: '70.41.3.18',
    };
    req.userId = 'user-123';
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('203.0.113.195'); // Should use first IP from first array element
  });

  it('should handle x-forwarded-for header with extra spaces', () => {
    // Arrange
    req = {
      method: 'POST',
      path: '/messages',
      url: '/messages',
      headers: {
        'user-agent': 'TestAgent/1.0',
        'x-forwarded-for': '  203.0.113.195  ,   70.41.3.18  ',
      },
      ip: '70.41.3.18',
    };
    req.userId = 'user-123';
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('203.0.113.195'); // Should trim spaces
  });

  it('should handle uppercase X-Request-Id header', () => {
    // Arrange
    req.headers = { ...req.headers, 'X-Request-Id': 'REQ-UPPERCASE' };
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    const middleware = loggerMiddleware();

    // Act
    middleware(req as Request, res as Response, next);
    
    // Trigger finish
    const finishCallback = (res as any).finishCallback;
    finishCallback();

    // Assert
    const firstCall = mockConsoleLog.mock.calls[0][0];
    expect(firstCall).toContain('REQ-UPPERCASE');
  });
});