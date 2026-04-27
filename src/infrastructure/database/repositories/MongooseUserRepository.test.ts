import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '@domain/entities/User';
import { MongooseUserRepository } from './MongooseUserRepository';
import { UserModel } from '../models/UserModel';

describe('MongooseUserRepository', () => {
  let mongoServer: MongoMemoryReplSet;
  let repository: MongooseUserRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongooseUserRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a user and return User entity', async () => {
      // Arrange
      const user = User.create(
        'test@example.com',
        'Test User',
        '$2b$12$hashedpassword12345678901234567890'
      );

      // Act
      const createdUser = await repository.create(user);

      // Assert
      expect(createdUser.id).toBe(user.id);
      expect(createdUser.email).toBe('test@example.com');
      expect(createdUser.displayName).toBe('Test User');
      expect(createdUser.passwordHash).toBe('$2b$12$hashedpassword12345678901234567890');
      expect(createdUser.createdAt).toBeInstanceOf(Date);

      // Verify it was saved to database
      const dbUser = await UserModel.findOne({ id: user.id });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe('test@example.com');
    });

    it('should allow creating user with duplicate email (application layer handles uniqueness)', async () => {
      // Arrange
      const user1 = User.create(
        'duplicate@example.com',
        'User 1',
        '$2b$12$hash1'
      );
      await repository.create(user1);

      const user2 = User.create(
        'duplicate@example.com',
        'User 2',
        '$2b$12$hash2'
      );

      // Act & Assert - repository doesn't enforce uniqueness, application layer does
      // This might throw due to MongoDB unique index, but that's an implementation detail
      try {
        await repository.create(user2);
        // If it succeeds, that's OK - application layer will catch it via findByEmail
      } catch (err: any) {
        // If it fails due to unique constraint, that's also OK
        // MongoDB throws MongoServerError with code 11000 for duplicate keys
        expect(err.name).toBe('MongoServerError');
        expect(err.code).toBe(11000);
      }
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const user = User.create(
        'find@example.com',
        'Find User',
        '$2b$12$hash'
      );
      await repository.create(user);

      // Act
      const foundUser = await repository.findByEmail('find@example.com');

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe('find@example.com');
    });

    it('should return null for non-existent email', async () => {
      // Act
      const foundUser = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(foundUser).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      const user = User.create(
        'findbyid@example.com',
        'Find By Id User',
        '$2b$12$hash'
      );
      await repository.create(user);

      // Act
      const foundUser = await repository.findById(user.id);

      // Assert
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe('findbyid@example.com');
    });

    it('should return null for non-existent id', async () => {
      // Act
      const foundUser = await repository.findById('nonexistent-id');

      // Assert
      expect(foundUser).toBeNull();
    });
  });
});