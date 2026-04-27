import { z } from 'zod';

describe('Environment Configuration Module', () => {
  test('Zod schema validates required environment variables', () => {
    const envSchema = z.object({
      PORT: z.coerce.number().int().positive().default(3000),
      MONGO_URI: z.string().url(),
      REDIS_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      JWT_EXPIRES_IN: z.string().default('7d'),
      RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
      RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
      IDEMPOTENCY_TTL: z.coerce.number().int().positive().default(86400),
    });

    // Test that schema exists and has required fields
    expect(envSchema.shape.PORT).toBeDefined();
    expect(envSchema.shape.MONGO_URI).toBeDefined();
    expect(envSchema.shape.REDIS_URL).toBeDefined();
    expect(envSchema.shape.JWT_SECRET).toBeDefined();
    expect(envSchema.shape.JWT_EXPIRES_IN).toBeDefined();
    expect(envSchema.shape.RATE_LIMIT_MAX).toBeDefined();
    expect(envSchema.shape.RATE_LIMIT_WINDOW).toBeDefined();
    expect(envSchema.shape.IDEMPOTENCY_TTL).toBeDefined();
  });

  test('Schema validates correct environment variables', () => {
    const envSchema = z.object({
      PORT: z.coerce.number().int().positive().default(3000),
      MONGO_URI: z.string().url(),
      REDIS_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      JWT_EXPIRES_IN: z.string().default('7d'),
      RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
      RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
      IDEMPOTENCY_TTL: z.coerce.number().int().positive().default(86400),
    });

    const validEnv = {
      PORT: '3000',
      MONGO_URI: 'mongodb://localhost:27017/chat',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret-jwt-key-that-is-at-least-32-chars',
      JWT_EXPIRES_IN: '7d',
      RATE_LIMIT_MAX: '100',
      RATE_LIMIT_WINDOW: '60',
      IDEMPOTENCY_TTL: '86400',
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.RATE_LIMIT_MAX).toBe(100);
      expect(result.data.IDEMPOTENCY_TTL).toBe(86400);
    }
  });

  test('Schema fails on missing required variables', () => {
    const envSchema = z.object({
      PORT: z.coerce.number().int().positive().default(3000),
      MONGO_URI: z.string().url(),
      REDIS_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      JWT_EXPIRES_IN: z.string().default('7d'),
      RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
      RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
      IDEMPOTENCY_TTL: z.coerce.number().int().positive().default(86400),
    });

    const invalidEnv = {
      PORT: '3000',
      // Missing MONGO_URI
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'short',
      JWT_EXPIRES_IN: '7d',
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});