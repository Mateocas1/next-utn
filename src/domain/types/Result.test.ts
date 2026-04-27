import { Result, success, failure } from './Result';
import { DomainError } from '../errors/DomainError';

describe('Result', () => {
  describe('success', () => {
    it('should create a successful result with value', () => {
      const result = success(42);
      
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
    });

    it('should throw when accessing error on success', () => {
      const result = success('test');
      
      expect(() => result.error).toThrow('Cannot access error on success');
    });
  });

  describe('failure', () => {
    it('should create a failed result with error', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error);
      
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('should throw when accessing value on failure', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error);
      
      expect(() => result.value).toThrow('Cannot access value on failure');
    });
  });

  describe('map', () => {
    it('should transform value on success', () => {
      const result = success(5).map(x => x * 2);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should not transform on failure', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error).map(x => x * 2);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('flatMap', () => {
    it('should chain successful results', () => {
      const result = success(5)
        .flatMap(x => success(x * 2))
        .flatMap(x => success(x + 1));
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(11);
    });

    it('should propagate failure', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = success(5)
        .flatMap(x => success(x * 2))
        .flatMap(() => failure(error));
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('should short-circuit on first failure', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error)
        .flatMap(() => success('should not run'));
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('match', () => {
    it('should execute success handler for successful result', () => {
      const result = success(42);
      const output = result.match(
        value => `Value: ${value}`,
        error => `Error: ${error.message}`
      );
      
      expect(output).toBe('Value: 42');
    });

    it('should execute failure handler for failed result', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error);
      const output = result.match(
        value => `Value: ${value}`,
        error => `Error: ${error.message}`
      );
      
      expect(output).toBe('Error: Test error');
    });
  });

  describe('getOrElse', () => {
    it('should return value for successful result', () => {
      const result = success(42);
      const value = result.getOrElse(100);
      
      expect(value).toBe(42);
    });

    it('should return default value for failed result', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error);
      const value = result.getOrElse(100);
      
      expect(value).toBe(100);
    });
  });

  describe('getOrThrow', () => {
    it('should return value for successful result', () => {
      const result = success(42);
      const value = result.getOrThrow();
      
      expect(value).toBe(42);
    });

    it('should throw error for failed result', () => {
      const error = new DomainError('TEST_ERROR', 'Test error');
      const result = failure(error);
      
      expect(() => result.getOrThrow()).toThrow(error);
    });
  });
});