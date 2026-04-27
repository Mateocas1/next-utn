import mongoose from 'mongoose';
import { getEnv } from '../../config/env';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerMetrics {
  failures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  state: CircuitBreakerState;
}

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private metrics: CircuitBreakerMetrics = {
    failures: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    state: 'CLOSED',
  };
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 60 seconds
  private readonly halfOpenTimeout = 30000; // 30 seconds
  private isConnected = false;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
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
    if (this.isConnected) {
      return;
    }

    if (!this.shouldAllowRequest()) {
      throw new Error('Circuit breaker is OPEN - MongoDB connection unavailable');
    }

    try {
      const env = getEnv();
      
      await mongoose.connect(env.MONGO_URI, {
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      this.recordSuccess();
      
      console.log('MongoDB connected successfully');
    } catch (error) {
      this.recordFailure();
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('MongoDB disconnect failed:', error);
      throw error;
    }
  }

  getConnection(): typeof mongoose {
    if (!this.isConnected) {
      throw new Error('MongoDB not connected');
    }
    return mongoose;
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
}

export const mongoDBConnection = MongoDBConnection.getInstance();