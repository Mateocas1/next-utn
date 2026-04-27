import { DomainEvent } from './DomainEvent';
import { MessageSentEvent } from './MessageSentEvent';

describe('DomainEvent', () => {
  describe('base interface', () => {
    it('should have required properties', () => {
      const event: DomainEvent = {
        type: 'TEST_EVENT',
        timestamp: new Date(),
        payload: { test: 'data' },
      };
      
      expect(event.type).toBe('TEST_EVENT');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload).toEqual({ test: 'data' });
    });
  });

  describe('MessageSentEvent', () => {
    it('should create a valid MessageSentEvent', () => {
      const payload = {
        messageId: 'msg-1',
        chatId: 'chat-1',
        senderId: 'user-1',
        content: 'Hello world!',
        createdAt: new Date(),
      };
      
      const event = new MessageSentEvent(payload);
      
      expect(event.type).toBe('MESSAGE_SENT');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload).toEqual(payload);
      expect(event.payload.messageId).toBe('msg-1');
      expect(event.payload.chatId).toBe('chat-1');
      expect(event.payload.senderId).toBe('user-1');
      expect(event.payload.content).toBe('Hello world!');
      expect(event.payload.createdAt).toBeInstanceOf(Date);
    });

    it('should have timestamp close to creation time', () => {
      const before = Date.now();
      const event = new MessageSentEvent({
        messageId: 'msg-1',
        chatId: 'chat-1',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
      });
      const after = Date.now();
      
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it('should handle different payload data', () => {
      const payload1 = {
        messageId: 'msg-2',
        chatId: 'chat-2',
        senderId: 'user-2',
        content: 'Another message',
        createdAt: new Date('2024-01-01'),
      };
      
      const event1 = new MessageSentEvent(payload1);
      expect(event1.payload).toEqual(payload1);
      
      const payload2 = {
        messageId: 'msg-3',
        chatId: 'chat-3',
        senderId: 'user-3',
        content: 'Different content',
        createdAt: new Date('2024-01-02'),
      };
      
      const event2 = new MessageSentEvent(payload2);
      expect(event2.payload).toEqual(payload2);
    });

    it('should be instance of DomainEvent', () => {
      const event = new MessageSentEvent({
        messageId: 'msg-1',
        chatId: 'chat-1',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
      });
      
      // Structural typing check
      expect(event).toHaveProperty('type', 'MESSAGE_SENT');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('payload');
    });
  });
});