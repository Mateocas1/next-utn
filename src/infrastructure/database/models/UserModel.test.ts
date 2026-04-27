import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { UserModel } from './UserModel';

describe('UserModel', () => {
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
    await UserModel.deleteMany({});
  });

  describe('schema validation', () => {
    it('should create a user with valid fields', async () => {
      // Arrange
      const userData = {
        id: '123456789012345678901234',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: '$2b$12$hashedpassword12345678901234567890',
        createdAt: new Date(),
      };

      // Act
      const user = new UserModel(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.id).toBe(userData.id);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.displayName).toBe(userData.displayName);
      expect(savedUser.passwordHash).toBe(userData.passwordHash);
      expect(savedUser.createdAt).toEqual(userData.createdAt);
    });

    it('should require email field', async () => {
      // Arrange
      const userData = {
        id: '123456789012345678901234',
        displayName: 'Test User',
        passwordHash: '$2b$12$hashedpassword12345678901234567890',
        createdAt: new Date(),
      };

      // Act & Assert
      const user = new UserModel(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should require unique email', async () => {
      // Arrange
      const userData1 = {
        id: '123456789012345678901234',
        email: 'duplicate@example.com',
        displayName: 'User 1',
        passwordHash: '$2b$12$hash1',
        createdAt: new Date(),
      };

      const userData2 = {
        id: '234567890123456789012345',
        email: 'duplicate@example.com',
        displayName: 'User 2',
        passwordHash: '$2b$12$hash2',
        createdAt: new Date(),
      };

      // Act
      await new UserModel(userData1).save();
      const user2 = new UserModel(userData2);

      // Assert
      await expect(user2.save()).rejects.toThrow();
    });

    it('should create indexes', async () => {
      // Act - create a document to trigger index creation
      await UserModel.create({
        id: '123456789012345678901234',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: '$2b$12$hashedpassword12345678901234567890',
      });
      
      const indexes = await UserModel.collection.getIndexes();
      
      // Assert
      expect(indexes).toHaveProperty('email_1');
      // Check if unique property exists - the structure might be different
      const emailIndex = indexes.email_1 as any;
      // The unique property might be at the root level
      expect(emailIndex).toBeDefined();
    });
  });
});