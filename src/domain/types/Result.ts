import { DomainError } from '../errors/DomainError';

export type Result<T, E extends DomainError = DomainError> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {}

  get error(): never {
    throw new Error('Cannot access error on success');
  }

  map<U>(fn: (value: T) => U): Result<U> {
    return success(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    return fn(this.value);
  }

  match<U>(onSuccess: (value: T) => U, onFailure: (error: DomainError) => U): U {
    return onSuccess(this.value);
  }

  getOrElse(defaultValue: T): T {
    return this.value;
  }

  getOrThrow(): T {
    return this.value;
  }
}

export class Failure<E extends DomainError> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {}

  get value(): never {
    throw new Error('Cannot access value on failure');
  }

  map<U>(fn: (value: never) => U): Result<U, E> {
    return failure(this.error);
  }

  flatMap<U>(fn: (value: never) => Result<U>): Result<U, E> {
    return failure(this.error);
  }

  match<U>(onSuccess: (value: never) => U, onFailure: (error: E) => U): U {
    return onFailure(this.error);
  }

  getOrElse<U>(defaultValue: U): U {
    return defaultValue;
  }

  getOrThrow(): never {
    throw this.error;
  }
}

export function success<T>(value: T): Result<T> {
  return new Success(value);
}

export function failure<E extends DomainError>(error: E): Result<any, E> {
  return new Failure(error);
}