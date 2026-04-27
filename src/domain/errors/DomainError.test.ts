import {
  DomainError,
  ValidationError,
  DuplicateEmailError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
  RateLimitExceededError,
  IdempotencyConflictError,
  ConcurrentModificationError,
  ServiceUnavailableError
} from './DomainError';

describe('DomainError', () => {
  describe('base class', () => {
    it('should create an error with default status code 400', () => {
      const error = new DomainError('VALIDATION_ERROR', 'Validation failed');
      
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('DomainError');
    });

    it('should create an error with custom status code', () => {
      const error = new DomainError('NOT_FOUND', 'Resource not found', 404);
      
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should be an instance of Error', () => {
      const error = new DomainError('TEST', 'Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('ValidationError', () => {
    it('should have errorCode VALIDATION_ERROR and status 400', () => {
      const error = new ValidationError('Email is invalid');
      
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Email is invalid');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('DuplicateEmailError', () => {
    it('should have errorCode EMAIL_ALREADY_EXISTS and status 409', () => {
      const error = new DuplicateEmailError();
      
      expect(error.errorCode).toBe('EMAIL_ALREADY_EXISTS');
      expect(error.message).toBe('Email already registered');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('AuthenticationError', () => {
    it('should have errorCode AUTHENTICATION_FAILED and status 401', () => {
      const error = new AuthenticationError();
      
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
      expect(error.message).toBe('Invalid email or password');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('NotFoundError', () => {
    it('should have errorCode NOT_FOUND and status 404', () => {
      const error = new NotFoundError('User');
      
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should include resource name in message', () => {
      const error = new NotFoundError('Chat');
      
      expect(error.message).toBe('Chat not found');
    });
  });

  describe('ForbiddenError', () => {
    it('should have errorCode FORBIDDEN and status 403', () => {
      const error = new ForbiddenError('Access denied');
      
      expect(error.errorCode).toBe('FORBIDDEN');
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('RateLimitExceededError', () => {
    it('should have errorCode RATE_LIMIT_EXCEEDED and status 429', () => {
      const error = new RateLimitExceededError();
      
      expect(error.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
    });
  });

  describe('IdempotencyConflictError', () => {
    it('should have errorCode IDEMPOTENCY_KEY_CONFLICT and status 409', () => {
      const error = new IdempotencyConflictError();
      
      expect(error.errorCode).toBe('IDEMPOTENCY_KEY_CONFLICT');
      expect(error.message).toBe('Idempotency key conflict');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ConcurrentModificationError', () => {
    it('should have errorCode CONCURRENT_MODIFICATION and status 409', () => {
      const error = new ConcurrentModificationError();
      
      expect(error.errorCode).toBe('CONCURRENT_MODIFICATION');
      expect(error.message).toBe('Concurrent modification detected');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should have errorCode SERVICE_UNAVAILABLE and status 503', () => {
      const error = new ServiceUnavailableError();
      
      expect(error.errorCode).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.statusCode).toBe(503);
    });
  });
});