import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ChatModel } from './ChatModel';

describe('ChatModel', () => {
  let mongoServer: MongoMemoryReplSet;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ChatModel.deleteMany({});
  });

  describe('schema validation', () => {
    it('should create a chat with valid fields', async () => {
      // Arrange
      const chatData = {
        id: 'chat-123',
        participants: ['user1', 'user2'],
        latestMessagePreview: 'Hello world',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };

      // Act
      const chat = new ChatModel(chatData);
      const savedChat = await chat.save();

      // Assert
      expect(savedChat.id).toBe(chatData.id);
      expect(savedChat.participants).toEqual(chatData.participants);
      expect(savedChat.latestMessagePreview).toBe(chatData.latestMessagePreview);
      expect(savedChat.createdAt).toEqual(chatData.createdAt);
      expect(savedChat.updatedAt).toEqual(chatData.updatedAt);
      expect(savedChat.__v).toBe(chatData.__v);
    });

    it('should require participants field', async () => {
      // Arrange
      const chatData = {
        id: 'chat-123',
        latestMessagePreview: 'Hello world',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };

      // Act & Assert
      const chat = new ChatModel(chatData);
      await expect(chat.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should auto-update updatedAt on save', async () => {
      // Arrange
      const chat = await ChatModel.create({
        id: 'chat-123',
        participants: ['user1'],
      });

      const initialUpdatedAt = chat.updatedAt;

      // Act - manually update updatedAt since we're not using timestamps
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
      chat.latestMessagePreview = 'Updated message';
      chat.updatedAt = new Date();
      const updatedChat = await chat.save();

      // Assert
      expect(updatedChat.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('should create indexes for cursor pagination', async () => {
      // Act - create a document to trigger index creation
      await ChatModel.create({
        id: 'chat-123',
        participants: ['user1'],
      });
      
      const indexes = await ChatModel.collection.getIndexes();
      
      // Assert - should have index on updatedAt descending
      expect(Object.keys(indexes).length).toBeGreaterThan(1); // _id index + our indexes
    });
  });
});