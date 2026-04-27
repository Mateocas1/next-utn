import { Message } from './Message';

describe('Message', () => {
  describe('create', () => {
    it('should create a valid message', () => {
      const message = Message.create('chat-1', 'user-1', 'Hello world!');
      
      expect(message.id).toBeDefined();
      expect(message.chatId).toBe('chat-1');
      expect(message.senderId).toBe('user-1');
      expect(message.content).toBe('Hello world!');
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    it('should reject empty content', () => {
      expect(() => Message.create('chat-1', 'user-1', ''))
        .toThrow('Content must be between 1 and 2000 characters');
    });

    it('should reject content longer than 2000 characters', () => {
      const longContent = 'A'.repeat(2001);
      
      expect(() => Message.create('chat-1', 'user-1', longContent))
        .toThrow('Content must be between 1 and 2000 characters');
    });

    it('should accept content of exactly 2000 characters', () => {
      const exactContent = 'A'.repeat(2000);
      const message = Message.create('chat-1', 'user-1', exactContent);
      
      expect(message.content).toBe(exactContent);
    });

    it('should accept content of exactly 1 character', () => {
      const message = Message.create('chat-1', 'user-1', 'A');
      
      expect(message.content).toBe('A');
    });

    it('should create message with valid UUID', () => {
      const message = Message.create('chat-1', 'user-1', 'Test');
      
      // UUID format: 8-4-4-4-12 hex digits
      expect(message.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should handle normal message content', () => {
      const content = 'Hello, how are you doing today?';
      const message = Message.create('chat-1', 'user-1', content);
      
      expect(message.content).toBe(content);
    });

    it('should handle message with special characters', () => {
      const content = 'Hello! @user #tag $100 💯';
      const message = Message.create('chat-1', 'user-1', content);
      
      expect(message.content).toBe(content);
    });

    it('should handle multiline message content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const message = Message.create('chat-1', 'user-1', content);
      
      expect(message.content).toBe(content);
    });
  });

  describe('timestamps', () => {
    it('should have createdAt timestamp', () => {
      const before = Date.now();
      const message = Message.create('chat-1', 'user-1', 'Test');
      const after = Date.now();
      
      expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(message.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });
});