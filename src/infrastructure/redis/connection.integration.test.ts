import { RedisConnection, redisConnection } from './connection';

describe('Redis Connection - Integration', () => {
  let connection: RedisConnection;

  beforeEach(() => {
    connection = RedisConnection.getInstance();
    connection.resetCircuitBreaker();
  });

  test('getInstance returns singleton', () => {
    const instance1 = RedisConnection.getInstance();
    const instance2 = RedisConnection.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  test('Circuit breaker starts in CLOSED state', () => {
    const metrics = connection.getMetrics();
    
    expect(metrics.state).toBe('CLOSED');
    expect(metrics.failures).toBe(0);
    expect(metrics.lastFailureTime).toBeNull();
    expect(metrics.lastSuccessTime).toBeNull();
  });

  test('resetCircuitBreaker resets metrics', () => {
    connection.resetCircuitBreaker();
    const metrics = connection.getMetrics();
    
    expect(metrics.state).toBe('CLOSED');
    expect(metrics.failures).toBe(0);
    expect(metrics.lastFailureTime).toBeNull();
    expect(metrics.lastSuccessTime).toBeNull();
  });

  test('redisConnection export works', () => {
    expect(redisConnection).toBeDefined();
    expect(redisConnection).toBeInstanceOf(RedisConnection);
  });

  test('healthCheck returns false when not connected', async () => {
    const health = await connection.healthCheck();
    expect(health).toBe(false);
  });
});