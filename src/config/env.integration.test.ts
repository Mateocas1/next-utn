describe('Environment Configuration Module - Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('loadEnvConfig loads and validates environment variables', () => {
    process.env.PORT = '3001';
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    process.env.JWT_SECRET = 'super-secret-jwt-key-that-is-at-least-32-chars';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.RATE_LIMIT_MAX = '50';
    process.env.RATE_LIMIT_WINDOW = '30';
    process.env.IDEMPOTENCY_TTL = '3600';

    jest.isolateModules(() => {
      const { loadEnvConfig } = require('./env');
      const config = loadEnvConfig();
      
      expect(config.PORT).toBe(3001);
      expect(config.MONGO_URI).toBe('mongodb://localhost:27017/test');
      expect(config.REDIS_URL).toBe('redis://localhost:6379/0');
      expect(config.JWT_SECRET).toBe('super-secret-jwt-key-that-is-at-least-32-chars');
      expect(config.JWT_EXPIRES_IN).toBe('1h');
      expect(config.RATE_LIMIT_MAX).toBe(50);
      expect(config.RATE_LIMIT_WINDOW).toBe(30);
      expect(config.IDEMPOTENCY_TTL).toBe(3600);
    });
  });

  test('loadEnvConfig uses default values when not provided', () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    process.env.JWT_SECRET = 'super-secret-jwt-key-that-is-at-least-32-chars';

    jest.isolateModules(() => {
      const { loadEnvConfig } = require('./env');
      const config = loadEnvConfig();
      
      expect(config.PORT).toBe(3000); // default
      expect(config.JWT_EXPIRES_IN).toBe('7d'); // default
      expect(config.RATE_LIMIT_MAX).toBe(100); // default
      expect(config.RATE_LIMIT_WINDOW).toBe(60); // default
      expect(config.IDEMPOTENCY_TTL).toBe(86400); // default
    });
  });

  test('loadEnvConfig throws EnvConfigError on missing required variables', () => {
    process.env.PORT = '3000';
    // Missing MONGO_URI, REDIS_URL, JWT_SECRET

    jest.isolateModules(() => {
      const { loadEnvConfig } = require('./env');
      expect(() => loadEnvConfig()).toThrow('Environment validation failed');
      expect(() => loadEnvConfig()).toThrow('MONGO_URI');
    });
  });

  test('loadEnvConfig throws EnvConfigError on invalid JWT_SECRET length', () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    process.env.JWT_SECRET = 'too-short';

    jest.isolateModules(() => {
      const { loadEnvConfig } = require('./env');
      expect(() => loadEnvConfig()).toThrow('Environment validation failed');
      expect(() => loadEnvConfig()).toThrow('JWT_SECRET');
    });
  });

  test('getEnv loads configuration', () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    process.env.REDIS_URL = 'redis://localhost:6379/0';
    process.env.JWT_SECRET = 'super-secret-jwt-key-that-is-at-least-32-chars';

    // Clear cache and reload
    jest.isolateModules(() => {
      const { getEnv } = require('./env');
      const config = getEnv();
      expect(config.MONGO_URI).toBe('mongodb://localhost:27017/test');
      expect(config.REDIS_URL).toBe('redis://localhost:6379/0');
      expect(config.JWT_SECRET).toBe('super-secret-jwt-key-that-is-at-least-32-chars');
    });
  });
});