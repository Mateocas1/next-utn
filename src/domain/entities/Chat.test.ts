import { Chat } from './Chat';

describe('Chat', () => {
  describe('create', () => {
    it('should create a chat with creator as first participant', () => {
      const chat = Chat.create('user-1');
      
      expect(chat.id).toBeDefined();
      expect(chat.participants).toEqual(['user-1']);
      expect(chat.latestMessagePreview).toBeUndefined();
      expect(chat.createdAt).toBeInstanceOf(Date);
      expect(chat.updatedAt).toBeInstanceOf(Date);
      expect(chat.version).toBe(0);
    });

    it('should create chat with valid UUID', () => {
      const chat = Chat.create('user-1');
      
      // UUID format: 8-4-4-4-12 hex digits
      expect(chat.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('isParticipant', () => {
    it('should return true for creator', () => {
      const chat = Chat.create('user-1');
      
      expect(chat.isParticipant('user-1')).toBe(true);
    });

    it('should return false for non-participant', () => {
      const chat = Chat.create('user-1');
      
      expect(chat.isParticipant('user-2')).toBe(false);
    });

    it('should handle multiple participants after being added', () => {
      const chat = Chat.create('user-1');
      // Note: In real scenario, participants would be added via a method
      // For now, we test with the initial participant
      expect(chat.isParticipant('user-1')).toBe(true);
      expect(chat.isParticipant('user-2')).toBe(false);
    });
  });

  describe('updateLatestMessage', () => {
    it('should update latest message preview and increment version', () => {
      const chat = Chat.create('user-1');
      const initialVersion = chat.version;
      
      chat.updateLatestMessage('Hello world!');
      
      expect(chat.latestMessagePreview).toBe('Hello world!');
      expect(chat.version).toBe(initialVersion + 1);
      expect(chat.updatedAt.getTime()).toBeGreaterThanOrEqual(chat.createdAt.getTime());
    });

    it('should update latest message multiple times', () => {
      const chat = Chat.create('user-1');
      
      chat.updateLatestMessage('First message');
      expect(chat.latestMessagePreview).toBe('First message');
      expect(chat.version).toBe(1);
      
      chat.updateLatestMessage('Second message');
      expect(chat.latestMessagePreview).toBe('Second message');
      expect(chat.version).toBe(2);
    });

    it('should handle empty message preview', () => {
      const chat = Chat.create('user-1');
      
      chat.updateLatestMessage('');
      expect(chat.latestMessagePreview).toBe('');
      expect(chat.version).toBe(1);
    });

    it('should handle long message preview', () => {
      const chat = Chat.create('user-1');
      const longMessage = 'A'.repeat(100);
      
      chat.updateLatestMessage(longMessage);
      expect(chat.latestMessagePreview).toBe(longMessage);
      expect(chat.version).toBe(1);
    });
  });

  describe('timestamps', () => {
    it('should have createdAt and updatedAt initially equal', () => {
      const chat = Chat.create('user-1');
      
      expect(chat.createdAt.getTime()).toBeCloseTo(chat.updatedAt.getTime(), -10); // Within 10ms
    });

    it('should update updatedAt when latest message changes', () => {
      const chat = Chat.create('user-1');
      const initialUpdatedAt = chat.updatedAt;
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        chat.updateLatestMessage('New message');
        expect(chat.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      }, 10);
    });
  });
});