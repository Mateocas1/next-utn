import Redis from 'ioredis';
import { RedisRateLimiter } from './RedisRateLimiter';

describe('RedisRateLimiter', () => {
  let redisClient: Redis;
  let rateLimiter: RedisRateLimiter;

  beforeAll(async () => {
    // Use a test Redis instance or mock
    redisClient = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });
    rateLimiter = new RedisRateLimiter(redisClient, 100, 60); // 100 requests per minute
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(async () => {
    await redisClient.flushall();
  });

  describe('check', () => {
    it('should allow request within rate limit', async () => {
      // Arrange
      const userId = 'user123';
      const endpoint = 'POST /messages';

      // Act - make 50 requests
      for (let i = 0; i < 50; i++) {
        const result = await rateLimiter.check(userId, endpoint);
        expect(result.allowed).toBe(true);
      }

      // Check the 51st request
      const result = await rateLimiter.check(userId, endpoint);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(50); // 100 - 51 = 49
      expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject request exceeding rate limit', async () => {
      // Arrange
      const userId = 'user456';
      const endpoint = 'POST /messages';

      // Act - make 100 requests (exact limit)
      for (let i = 0; i < 100; i++) {
        await rateLimiter.check(userId, endpoint);
      }

      // Check the 101st request
      const result = await rateLimiter.check(userId, endpoint);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should have separate buckets per endpoint', async () => {
      // Arrange
      const userId = 'user789';

      // Act - exceed limit on POST /messages
      for (let i = 0; i < 101; i++) {
        await rateLimiter.check(userId, 'POST /messages');
      }

      // Check GET /chats (different endpoint)
      const result = await rateLimiter.check(userId, 'GET /chats');

      // Assert - should be allowed since different endpoint
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // First request on this endpoint
    });

    it('should have separate buckets per user', async () => {
      // Arrange
      const user1 = 'user1';
      const user2 = 'user2';
      const endpoint = 'POST /messages';

      // Act - user1 exceeds limit
      for (let i = 0; i < 101; i++) {
        await rateLimiter.check(user1, endpoint);
      }

      // Check user2 (different user)
      const result = await rateLimiter.check(user2, endpoint);

      // Assert - user2 should be allowed
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // First request for user2
    });

    it('should implement sliding window algorithm', async () => {
      // Arrange
      const userId = 'sliding-user';
      const endpoint = 'POST /messages';

      // Mock Date.now to control time
      const realDateNow = Date.now.bind(global.Date);
      let currentTime = realDateNow();
      global.Date.now = jest.fn(() => currentTime);

      try {
        // Act - make requests spaced out
        const firstResult = await rateLimiter.check(userId, endpoint);
        expect(firstResult.allowed).toBe(true);

        // Advance time by 30 seconds (half the window)
        currentTime += 30000;

        // Make another request
        const secondResult = await rateLimiter.check(userId, endpoint);
        expect(secondResult.allowed).toBe(true);

        // Advance time by 31 seconds (now the first request is outside the 60s window)
        currentTime += 31000;

        // Make a third request
        const thirdResult = await rateLimiter.check(userId, endpoint);
        expect(thirdResult.allowed).toBe(true);
        
        // The remaining count should reflect sliding window
        // Since the first request expired, we should have 98 remaining (100 - 2 active requests)
        expect(thirdResult.remaining).toBe(98);
      } finally {
        // Restore Date.now
        global.Date.now = realDateNow;
      }
    });
  });
});