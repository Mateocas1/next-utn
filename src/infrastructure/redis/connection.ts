import Redis from 'ioredis';
import { getEnv } from '../../config/env';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerMetrics {
  failures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  state: CircuitBreakerState;
}

export class RedisConnection {
  private static instance: RedisConnection;
  private metrics: CircuitBreakerMetrics = {
    failures: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    state: 'CLOSED',
  };
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 60 seconds
  private readonly halfOpenTimeout = 30000; // 30 seconds
  private client: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  private shouldAllowRequest(): boolean {
    const now = Date.now();
    
    switch (this.metrics.state) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        if (this.metrics.lastFailureTime && 
            now - this.metrics.lastFailureTime >= this.resetTimeout) {
          this.metrics.state = 'HALF_OPEN';
          return true; // Allow one test request
        }
        return false;
      
      case 'HALF_OPEN':
        if (this.metrics.lastFailureTime && 
            now - this.metrics.lastFailureTime >= this.halfOpenTimeout) {
          return true; // Allow another test request
        }
        return false;
    }
  }

  private recordSuccess(): void {
    this.metrics.failures = 0;
    this.metrics.lastSuccessTime = Date.now();
    this.metrics.state = 'CLOSED';
  }

  private recordFailure(): void {
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();
    
    if (this.metrics.failures >= this.failureThreshold) {
      this.metrics.state = 'OPEN';
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (!this.shouldAllowRequest()) {
      throw new Error('Circuit breaker is OPEN - Redis connection unavailable');
    }

    try {
      const env = getEnv();
      
      this.client = new Redis(env.REDIS_URL, {
        retryStrategy: (times: number) => {
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });

      // Test connection with PING
      await this.client.ping();
      
      this.isConnected = true;
      this.recordSuccess();
      
      console.log('Redis connected successfully');
    } catch (error) {
      this.recordFailure();
      this.client = null;
      throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Redis disconnect failed:', error);
      throw error;
    }
  }

  getClient(): Redis {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  resetCircuitBreaker(): void {
    this.metrics = {
      failures: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      state: 'CLOSED',
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export const redisConnection = RedisConnection.getInstance();