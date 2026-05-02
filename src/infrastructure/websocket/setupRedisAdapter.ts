import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';

interface SocketIOAdapterTarget {
  adapter(adapterConstructor: ReturnType<typeof createAdapter>): void;
}

interface Logger {
  warn(message: string, error?: unknown): void;
}

interface SetupSocketRedisAdapterParams {
  io: SocketIOAdapterTarget;
  redisClient: Redis;
  logger: Logger;
}

type SetupSocketRedisAdapterResult =
  | { mode: 'redis'; subscriberClient: Redis }
  | { mode: 'single-node' };

export async function setupSocketRedisAdapter({
  io,
  redisClient,
  logger,
}: SetupSocketRedisAdapterParams): Promise<SetupSocketRedisAdapterResult> {
  try {
    const subscriberClient = redisClient.duplicate();
    await subscriberClient.connect();
    io.adapter(createAdapter(redisClient, subscriberClient));
    return {
      mode: 'redis',
      subscriberClient,
    };
  } catch (error) {
    logger.warn('Redis adapter unavailable. Realtime running in single-node mode.', error);
    return {
      mode: 'single-node',
    };
  }
}
