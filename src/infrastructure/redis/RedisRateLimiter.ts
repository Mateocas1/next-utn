import Redis from 'ioredis';
import { RateLimiter } from '@application/ports/RateLimiter';

export class RedisRateLimiter implements RateLimiter {
  constructor(
    private readonly redisClient: Redis,
    private readonly maxRequests: number = 100,
    private readonly windowSeconds: number = 60
  ) {}

  async check(
    userId: string, 
    endpoint: string
  ): Promise<{ 
    allowed: boolean; 
    remaining: number; 
    resetAt: number; 
  }> {
    const key = `rate_limit:${userId}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);

    // Remove old entries outside the sliding window
    await this.redisClient.zremrangebyscore(key, 0, windowStart);

    // Count current entries in the window
    const requestCount = await this.redisClient.zcard(key);

    if (requestCount >= this.maxRequests) {
      // Rate limit exceeded
      // Get oldest entry to calculate reset time
      const oldestEntry = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldestEntry.length > 0 
        ? Math.ceil(parseInt(oldestEntry[1]) / 1000) + this.windowSeconds
        : Math.ceil(now / 1000) + this.windowSeconds;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request to sorted set
    await this.redisClient.zadd(key, now, `${now}:${Math.random()}`);
    // Set expiry on the key (window seconds + 1 second buffer)
    await this.redisClient.expire(key, this.windowSeconds + 1);

    const remaining = this.maxRequests - requestCount - 1;
    const resetAt = Math.ceil(now / 1000) + this.windowSeconds;

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetAt,
    };
  }
}