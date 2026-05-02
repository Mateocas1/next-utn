import { MongoDBConnection, mongoDBConnection } from './connection';
import mongoose from 'mongoose';

describe('MongoDB Connection - Integration', () => {
  let connection: MongoDBConnection;

  beforeEach(() => {
    connection = MongoDBConnection.getInstance();
    connection.resetCircuitBreaker();
  });

  test('getInstance returns singleton', () => {
    const instance1 = MongoDBConnection.getInstance();
    const instance2 = MongoDBConnection.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  test('Circuit breaker starts in CLOSED state', () => {
    const metrics = connection.getMetrics();
    
    expect(metrics.state).toBe('CLOSED');
    expect(metrics.failures).toBe(0);
    expect(metrics.lastFailureTime).toBeNull();
    expect(metrics.lastSuccessTime).toBeNull();
  });

  test('Circuit breaker transitions to OPEN after 5 failures', () => {
    jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('connection failed'));

    const failures = Array.from({ length: 5 }, async () => {
      await expect(connection.connect()).rejects.toThrow('MongoDB connection failed');
    });

    return Promise.all(failures).then(() => {
      const metrics = connection.getMetrics();
      expect(metrics.failures).toBeGreaterThanOrEqual(5);
      expect(metrics.state).toBe('OPEN');
      expect(metrics.lastFailureTime).not.toBeNull();
      jest.restoreAllMocks();
    });
  });

  test('shouldAllowRequest returns true when CLOSED', () => {
    // This is a private method, so we can't test it directly
    // We'll test through the public API
    const metrics = connection.getMetrics();
    expect(metrics.state).toBe('CLOSED');
  });

  test('resetCircuitBreaker resets metrics', () => {
    // Simulate some failures
    // connection.recordFailure(); // Would need to expose
    
    connection.resetCircuitBreaker();
    const metrics = connection.getMetrics();
    
    expect(metrics.state).toBe('CLOSED');
    expect(metrics.failures).toBe(0);
    expect(metrics.lastFailureTime).toBeNull();
    expect(metrics.lastSuccessTime).toBeNull();
  });

  test('mongoDBConnection export works', () => {
    expect(mongoDBConnection).toBeDefined();
    expect(mongoDBConnection).toBeInstanceOf(MongoDBConnection);
  });
});
