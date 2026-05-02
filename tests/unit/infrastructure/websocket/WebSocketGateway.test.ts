import type { Server as SocketIOServer, Socket } from 'socket.io';
import { WebSocketGateway } from '../../../../src/infrastructure/websocket/gateway';
import { MessageSentEvent } from '../../../../src/domain/events/MessageSentEvent';
import { UserTypingEvent } from '../../../../src/domain/events/UserTypingEvent';
import { NotificationSentEvent } from '../../../../src/domain/events/NotificationSentEvent';
import { Notification } from '../../../../src/domain/entities/Notification';

describe('WebSocketGateway', () => {
  const createSocket = (): Socket => {
    return {
      data: { userId: 'user-1' },
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn(),
    } as unknown as Socket;
  };

  it('wires handleConnection and room contracts', () => {
    const socket = createSocket();
    const io = {
      to: jest.fn(),
    } as unknown as SocketIOServer;
    const gateway = new WebSocketGateway(io);

    gateway.handleConnection(socket);

    expect(socket.join).toHaveBeenCalledWith('user:user-1');
    expect(socket.on).toHaveBeenCalledWith('joinChat', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('leaveChat', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

    const joinHandler = (socket.on as jest.Mock).mock.calls.find(
      (entry: [string, (...args: unknown[]) => void]) => entry[0] === 'joinChat'
    )?.[1];
    const leaveHandler = (socket.on as jest.Mock).mock.calls.find(
      (entry: [string, (...args: unknown[]) => void]) => entry[0] === 'leaveChat'
    )?.[1];

    joinHandler?.('chat-123');
    leaveHandler?.('chat-123');

    expect(socket.join).toHaveBeenCalledWith('chat:chat-123');
    expect(socket.leave).toHaveBeenCalledWith('chat:chat-123');
  });

  it('subscribes event handlers and emits to route contracts', async () => {
    const toEmit = jest.fn();
    const io = {
      to: jest.fn().mockReturnValue({ emit: toEmit }),
    } as unknown as SocketIOServer;
    const gateway = new WebSocketGateway(io);

    const listeners = new Map<string, (event: any) => Promise<void>>();
    const eventBus = {
      subscribe: jest.fn((eventName: string, listener: (event: any) => Promise<void>) => {
        listeners.set(eventName, listener);
      }),
    };

    gateway.subscribe(eventBus as never);

    const messageEvent = new MessageSentEvent({
      messageId: 'm-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      content: 'hola',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await listeners.get(MessageSentEvent.name)?.(messageEvent);

    expect(io.to).toHaveBeenCalledWith('chat:chat-1');
    expect(toEmit).toHaveBeenCalledWith('message', {
      id: 'm-1',
      chatId: 'chat-1',
      senderId: 'user-1',
      content: 'hola',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const typingEvent = new UserTypingEvent({
      userId: 'user-2',
      chatId: 'chat-2',
    });
    await listeners.get(UserTypingEvent.name)?.(typingEvent);

    expect(io.to).toHaveBeenCalledWith('chat:chat-2');
    expect(toEmit).toHaveBeenCalledWith('typing', {
      userId: 'user-2',
      chatId: 'chat-2',
    });

    const notification = new Notification('user-3', 'title', 'body', { kind: 'info' });
    notification.id = 'n-1';
    notification.createdAt = new Date('2024-01-02T00:00:00.000Z');
    const notificationEvent = new NotificationSentEvent(notification);
    await listeners.get(NotificationSentEvent.name)?.(notificationEvent);

    expect(io.to).toHaveBeenCalledWith('user:user-3');
    expect(toEmit).toHaveBeenCalledWith('notification', {
      id: 'n-1',
      title: 'title',
      message: 'body',
      read: false,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      metadata: { kind: 'info' },
    });
  });
});
