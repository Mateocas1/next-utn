import type { Socket } from 'socket.io';
import { socketIOMiddleware } from './middleware';

describe('socketIOMiddleware', () => {
  const createSocket = (overrides?: Partial<Socket>): Socket => {
    return {
      handshake: {
        auth: {},
        headers: {},
      },
      data: {},
      ...overrides,
    } as unknown as Socket;
  };

  it('stores userId and calls next when token from auth is valid', async () => {
    const verify = jest.fn().mockResolvedValue({ userId: 'user-1' });
    const middleware = socketIOMiddleware({ verify } as never);
    const next = jest.fn();
    const socket = createSocket({
      handshake: {
        auth: { token: 'token-1' },
        headers: {},
      } as never,
    });

    await middleware(socket, next);

    expect(verify).toHaveBeenCalledWith('token-1');
    expect(socket.data.userId).toBe('user-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('supports bearer token from authorization header', async () => {
    const verify = jest.fn().mockResolvedValue({ userId: 'user-2' });
    const middleware = socketIOMiddleware({ verify } as never);
    const next = jest.fn();
    const socket = createSocket({
      handshake: {
        auth: {},
        headers: { authorization: 'Bearer token-2' },
      } as never,
    });

    await middleware(socket, next);

    expect(verify).toHaveBeenCalledWith('token-2');
    expect(socket.data.userId).toBe('user-2');
    expect(next).toHaveBeenCalledWith();
  });

  it('returns authentication error when token is missing', async () => {
    const verify = jest.fn();
    const middleware = socketIOMiddleware({ verify } as never);
    const next = jest.fn();
    const socket = createSocket();

    await middleware(socket, next);

    expect(verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect((next.mock.calls[0][0] as Error).message).toBe('Authentication error');
  });

  it('returns authentication error when verify rejects', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('invalid token'));
    const middleware = socketIOMiddleware({ verify } as never);
    const next = jest.fn();
    const socket = createSocket({
      handshake: {
        auth: { token: 'bad-token' },
        headers: {},
      } as never,
    });

    await middleware(socket, next);

    expect(verify).toHaveBeenCalledWith('bad-token');
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect((next.mock.calls[0][0] as Error).message).toBe('Authentication error');
  });
});
