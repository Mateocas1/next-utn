import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';
import { setupSocketRedisAdapter } from './setupRedisAdapter';

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn(),
}));

describe('setupSocketRedisAdapter', () => {
  const createAdapterMock = createAdapter as jest.MockedFunction<typeof createAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures Socket.IO redis adapter with duplicated pub/sub clients', async () => {
    const subConnect = jest.fn().mockResolvedValue(undefined);
    const subClient = { connect: subConnect } as unknown as Redis;
    const duplicate = jest.fn().mockReturnValue(subClient);
    const pubClient = { duplicate } as unknown as Redis;
    const adapterInstance = Symbol('adapter');

    createAdapterMock.mockReturnValue(adapterInstance as never);

    const io = {
      adapter: jest.fn(),
    };

    const warn = jest.fn();

    const result = await setupSocketRedisAdapter({
      io,
      redisClient: pubClient,
      logger: { warn },
    });

    expect(duplicate).toHaveBeenCalledTimes(1);
    expect(subConnect).toHaveBeenCalledTimes(1);
    expect(createAdapterMock).toHaveBeenCalledWith(pubClient, subClient);
    expect(io.adapter).toHaveBeenCalledWith(adapterInstance);
    expect(warn).not.toHaveBeenCalled();
    expect(result).toEqual({
      mode: 'redis',
      subscriberClient: subClient,
    });
  });

  it('falls back to single-node mode and logs warning when redis adapter setup fails', async () => {
    const setupError = new Error('redis adapter init failed');
    const duplicate = jest.fn(() => {
      throw setupError;
    });
    const pubClient = { duplicate } as unknown as Redis;

    const io = {
      adapter: jest.fn(),
    };

    const warn = jest.fn();

    const result = await setupSocketRedisAdapter({
      io,
      redisClient: pubClient,
      logger: { warn },
    });

    expect(io.adapter).not.toHaveBeenCalled();
    expect(createAdapterMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Redis adapter unavailable'),
      setupError
    );
    expect(result).toEqual({
      mode: 'single-node',
    });
  });
});
