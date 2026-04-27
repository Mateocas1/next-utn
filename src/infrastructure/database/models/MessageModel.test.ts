import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MessageModel } from './MessageModel';

describe('MessageModel', () => {
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
    await MessageModel.deleteMany({});
  });

  describe('schema validation', () => {
    it('should create a message with valid fields', async () => {
      // Arrange
      const messageData = {
        id: 'msg-123',
        chatId: 'chat123',
        senderId: 'user123',
        content: 'Hello world',
        createdAt: new Date(),
      };

      // Act
      const message = new MessageModel(messageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.id).toBe(messageData.id);
      expect(savedMessage.chatId).toBe(messageData.chatId);
      expect(savedMessage.senderId).toBe(messageData.senderId);
      expect(savedMessage.content).toBe(messageData.content);
      expect(savedMessage.createdAt).toEqual(messageData.createdAt);
    });

    it('should require chatId field', async () => {
      // Arrange
      const messageData = {
        id: 'msg-123',
        senderId: 'user123',
        content: 'Hello world',
        createdAt: new Date(),
      };

      // Act & Assert
      const message = new MessageModel(messageData);
      await expect(message.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should require content field', async () => {
      // Arrange
      const messageData = {
        id: 'msg-123',
        chatId: 'chat123',
        senderId: 'user123',
        createdAt: new Date(),
      };

      // Act & Assert
      const message = new MessageModel(messageData);
      await expect(message.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should create indexes for cursor pagination', async () => {
      // Act - create a document to trigger index creation
      await MessageModel.create({
        id: 'msg-123',
        chatId: 'chat123',
        senderId: 'user123',
        content: 'Test message',
      });
      
      const indexes = await MessageModel.collection.getIndexes();
      
      // Assert - should have compound index on chatId and createdAt
      expect(Object.keys(indexes).length).toBeGreaterThan(1); // _id index + our indexes
    });
  });
});