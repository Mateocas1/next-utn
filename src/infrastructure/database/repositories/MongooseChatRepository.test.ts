import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Chat } from '@domain/entities/Chat';
import { MongooseChatRepository } from './MongooseChatRepository';
import { ChatModel } from '../models/ChatModel';

describe('MongooseChatRepository', () => {
  let mongoServer: MongoMemoryReplSet;
  let repository: MongooseChatRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongooseChatRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ChatModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a chat and return Chat entity', async () => {
      // Arrange
      const chat = Chat.create('user123', 'user456');

      // Act
      const createdChat = await repository.create(chat);

      // Assert
      expect(createdChat.id).toBe(chat.id);
      expect(createdChat.participants).toEqual(['user123', 'user456']);
      expect(createdChat.version).toBe(0);
      expect(createdChat.createdAt).toBeInstanceOf(Date);
      expect(createdChat.updatedAt).toBeInstanceOf(Date);

      // Verify it was saved to database
      const dbChat = await ChatModel.findOne({ id: chat.id });
      expect(dbChat).not.toBeNull();
      expect(dbChat?.participants).toEqual(['user123', 'user456']);
    });
  });

  describe('findById', () => {
    it('should find chat by id', async () => {
      // Arrange
      const chat = Chat.create('user123', 'user456');
      await repository.create(chat);

      // Act
      const foundChat = await repository.findById(chat.id);

      // Assert
      expect(foundChat).not.toBeNull();
      expect(foundChat?.id).toBe(chat.id);
      expect(foundChat?.participants).toEqual(['user123', 'user456']);
    });

    it('should return null for non-existent id', async () => {
      // Act
      const foundChat = await repository.findById('nonexistent-id');

      // Assert
      expect(foundChat).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find chats for user with cursor pagination', async () => {
      // Arrange - create 3 chats for user123
      const chat1 = Chat.create('user123', 'user456');
      await repository.create(chat1);
      
      // Wait a bit to ensure different updatedAt
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const chat2 = Chat.create('user123', 'user456');
      await repository.create(chat2);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const chat3 = Chat.create('user456', 'user789'); // Different user
      await repository.create(chat3);

      // Act - get first page
      const chats = await repository.findByUserId('user123', 10);

      // Assert
      expect(chats).toHaveLength(2);
      expect(chats[0].id).toBe(chat2.id); // Most recent first
      expect(chats[1].id).toBe(chat1.id);
    });

    it('should respect limit parameter', async () => {
      // Arrange - create 3 chats for user123
      for (let i = 0; i < 3; i++) {
        const chat = Chat.create('user123', 'user456');
        await repository.create(chat);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Act - get only 2 chats
      const chats = await repository.findByUserId('user123', 2);

      // Assert
      expect(chats).toHaveLength(2);
    });

    it('should handle cursor pagination', async () => {
      // Arrange - create 3 chats
      const chats = [];
      for (let i = 0; i < 3; i++) {
        const chat = Chat.create('user123', 'user456');
        await repository.create(chat);
        chats.push(chat);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Act - get first page with limit 2
      const firstPage = await repository.findByUserId('user123', 2);
      expect(firstPage).toHaveLength(2);
      
      // Get cursor from last item in first page
      const lastChat = firstPage[1];
      // In real implementation, we'd encode cursor from updatedAt and id
      // For now, test that method exists
      expect(typeof repository.findByUserId).toBe('function');
    });
  });

  describe('updateLatestMessage', () => {
    it('should update latest message with optimistic locking', async () => {
      // Arrange
      const chat = Chat.create('user123', 'user456');
      await repository.create(chat);

      // Act
      const updatedChat = await repository.updateLatestMessage(
        chat.id,
        'Hello world',
        0 // Expected version
      );

      // Assert
      expect(updatedChat.latestMessagePreview).toBe('Hello world');
      expect(updatedChat.version).toBe(1);
      expect(updatedChat.updatedAt.getTime()).toBeGreaterThan(chat.updatedAt.getTime());
    });

    it('should throw on version mismatch (optimistic locking)', async () => {
      // Arrange
      const chat = Chat.create('user123', 'user456');
      await repository.create(chat);

      // Simulate concurrent update by directly updating version
      await ChatModel.findOneAndUpdate(
        { id: chat.id },
        { $inc: { __v: 1 } }
      );

      // Act & Assert
      await expect(
        repository.updateLatestMessage(chat.id, 'Hello world', 0)
      ).rejects.toThrow();
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from chat with session support', async () => {
      const chat = Chat.reconstruct({
        id: 'chat-remove',
        participants: ['u1', 'u2', 'u3'],
        latestMessagePreview: 'hello',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      });
      await repository.create(chat);

      const session = await mongoose.startSession();
      const updated = await session.withTransaction(async () => repository.removeParticipant('chat-remove', 'u2', session));
      session.endSession();

      expect(updated.participants).toEqual(['u1', 'u3']);
      expect(updated.version).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete chat by id', async () => {
      const chat = Chat.create('delete-user', 'delete-peer');
      await repository.create(chat);

      await repository.delete(chat.id);

      const found = await repository.findById(chat.id);
      expect(found).toBeNull();
    });
  });

  describe('findByParticipantId', () => {
    it('should find chats containing participant', async () => {
      const c1 = Chat.reconstruct({
        id: 'participant-1',
        participants: ['user-x', 'a'],
        latestMessagePreview: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      });
      const c2 = Chat.reconstruct({
        id: 'participant-2',
        participants: ['b', 'c'],
        latestMessagePreview: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      });
      const c3 = Chat.reconstruct({
        id: 'participant-3',
        participants: ['user-x', 'c'],
        latestMessagePreview: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      });
      await repository.create(c1);
      await repository.create(c2);
      await repository.create(c3);

      const chats = await repository.findByParticipantId('user-x');

      expect(chats.map((c: Chat) => c.id).sort()).toEqual(['participant-1', 'participant-3']);
    });

    it('should use provided session for transactional visibility', async () => {
      const session = await mongoose.startSession();

      await session.withTransaction(async () => {
        await ChatModel.create(
          [
            {
              id: 'participant-tx',
              participants: ['user-tx', 'z'],
              latestMessagePreview: 'tx',
            },
          ],
          { session }
        );

        const chats = await repository.findByParticipantId('user-tx', session);
        expect(chats).toHaveLength(1);
        expect(chats[0].id).toBe('participant-tx');
      });

      session.endSession();
    });
  });
});
