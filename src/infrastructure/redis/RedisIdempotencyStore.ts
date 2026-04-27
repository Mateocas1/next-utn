import Redis from 'ioredis';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';

export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly redisClient: Redis,
    private readonly defaultTtl: number = 86400 // 24 hours
  ) {}

  async get(key: string): Promise<string | null> {
    const fullKey = `idempotency:${key}`;
    return await this.redisClient.get(fullKey);
  }

  async set(key: string, response: string, ttl: number = this.defaultTtl): Promise<void> {
    const fullKey = `idempotency:${key}`;
    await this.redisClient.set(fullKey, response, 'EX', ttl);
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = `idempotency:${key}`;
    const result = await this.redisClient.exists(fullKey);
    return result === 1;
  }
}