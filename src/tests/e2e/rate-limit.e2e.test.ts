import request from 'supertest';
import { setupTestApp, cleanupTestApp, createTestUser } from './test-utils';

describe('Rate Limiting E2E Tests', () => {
  let testApp: any;
  let server: any;

  beforeAll(async () => {
    testApp = await setupTestApp();
    server = testApp.app;
  });

  afterAll(async () => {
    await cleanupTestApp(testApp);
  });

  describe('Rate Limiting', () => {
    it('should allow requests under the rate limit', async () => {
      // Create test user
      const { token } = await createTestUser(testApp, 'test1@example.com');

      // Make a request that should be allowed
      const res = await request(server)
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check that rate limit headers are present
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
      expect(res.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Create test user
      const { token } = await createTestUser(testApp, 'test2@example.com');

      // Make a single request to ensure user is authenticated
      await request(server)
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Mock the rate limiter to return exceeded limit
      jest.spyOn(testApp.rateLimiter, 'check').mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + 60
      });

      // This request should be rate limited
      const res = await request(server)
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(429);

      expect(res.body).toEqual({
        success: false,
        data: null,
        message: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT_EXCEEDED',
      });
      expect(res.headers).toHaveProperty('retry-after');
    });
  });
});