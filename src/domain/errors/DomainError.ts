export class DomainError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class DuplicateEmailError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 'Email already registered', 409);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string = 'Invalid email or password', errorCode: string = 'AUTHENTICATION_FAILED') {
    super(errorCode, message, 401);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class ChatAccessDeniedError extends DomainError {
  constructor() {
    super('CHAT_ACCESS_DENIED', 'Chat access denied', 403);
  }
}

export class RateLimitExceededError extends DomainError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429);
  }
}

export class IdempotencyConflictError extends DomainError {
  constructor() {
    super('IDEMPOTENCY_KEY_CONFLICT', 'Idempotency key conflict', 409);
  }
}

export class ConcurrentModificationError extends DomainError {
  constructor() {
    super('CONCURRENT_MODIFICATION', 'Concurrent modification detected', 409);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor() {
    super('SERVICE_UNAVAILABLE', 'Service temporarily unavailable', 503);
  }
}

export class InvalidCursorError extends DomainError {
  constructor() {
    super('INVALID_CURSOR', 'Invalid cursor format', 400);
  }
}