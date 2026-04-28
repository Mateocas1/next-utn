"use strict";

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import { WebSocketGateway } from '../../../../src/infrastructure/websocket/gateway';
import { EventBus } from '../../../../src/application/ports/EventBus';
import { MessageSentEvent } from '../../../../src/domain/events/MessageSentEvent';
import { UserTypingEvent } from '../../../../src/domain/events/UserTypingEvent';

// Mock EventBus
class MockEventBus implements EventBus {
  private subscribers: Record<string, Function[]> = {};

  subscribe(eventName: string, callback: Function): void {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }
    this.subscribers[eventName].push(callback);
  }

  async publish(event: any): Promise<void> {
    const eventName = event.constructor.name;
    if (this.subscribers[eventName]) {
      for (const callback of this.subscribers[eventName]) {
        await callback(event);
      }
    }
  }
}

describe('WebSocketGateway', () => {
  let io: SocketIOServer;
  let gateway: WebSocketGateway;
  let mockEventBus: MockEventBus;
  let httpServer: any;
  let socket: Socket;

  beforeAll((done) => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer);
    mockEventBus = new MockEventBus();
    gateway = new WebSocketGateway(io);
    gateway.subscribe(mockEventBus);

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      socket = new Socket(`http://localhost:${port}`) as any;
      (socket as any).data = { userId: 'test-user-id' };
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  it('should handle connection and join user room', (done) => {
    io.on('connection', (socket) => {
      gateway.handleConnection(socket);
      expect(socket.rooms.has(`user:test-user-id`)).toBe(true);
      done();
    });
    socket.connect();
  });

  it('should handle joinChat event', (done) => {
    io.on('connection', (socket) => {
      gateway.handleConnection(socket);
      socket.on('joinChat', (chatId: string) => {
        expect(socket.rooms.has(`chat:${chatId}`)).toBe(true);
        done();
      });
      socket.emit('joinChat', 'test-chat-id');
    });
    socket.connect();
  });

  it('should handle leaveChat event', (done) => {
    io.on('connection', (socket) => {
      gateway.handleConnection(socket);
      socket.on('joinChat', (chatId: string) => {
        socket.join(`chat:${chatId}`);
        socket.emit('leaveChat', chatId);
      });
      socket.on('leaveChat', (chatId: string) => {
        setTimeout(() => {
          expect(socket.rooms.has(`chat:${chatId}`)).toBe(false);
          done();
        }, 10);
      });
      socket.emit('joinChat', 'test-chat-id');
    });
    socket.connect();
  });

  it('should emit message event on MessageSentEvent', (done) => {
    const testEvent = new MessageSentEvent({
      messageId: 'test-message-id',
      chatId: 'test-chat-id',
      senderId: 'test-sender-id',
      content: 'Test message',
      createdAt: new Date(),
    });

    io.on('connection', (socket) => {
      socket.join(`chat:${testEvent.chatId}`);
      socket.on('message', (data) => {
        expect(data.id).toBe(testEvent.messageId);
        expect(data.chatId).toBe(testEvent.chatId);
        expect(data.senderId).toBe(testEvent.senderId);
        expect(data.content).toBe(testEvent.content);
        done();
      });

      mockEventBus.publish(testEvent);
    });
    socket.connect();
  });

  it('should emit typing event on UserTypingEvent', (done) => {
    const testEvent = new UserTypingEvent({
      userId: 'test-user-id',
      chatId: 'test-chat-id',
    });

    io.on('connection', (socket) => {
      socket.join(`chat:${testEvent.chatId}`);
      socket.on('typing', (data) => {
        expect(data.userId).toBe(testEvent.userId);
        expect(data.chatId).toBe(testEvent.chatId);
        done();
      });

      mockEventBus.publish(testEvent);
    });
    socket.connect();
  });
});