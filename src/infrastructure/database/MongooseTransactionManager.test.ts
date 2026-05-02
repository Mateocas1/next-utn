import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '@domain/entities/User';
import { UserModel } from './models/UserModel';
import { MongooseTransactionManager } from './MongooseTransactionManager';

describe('MongooseTransactionManager', () => {
  let mongoServer: MongoMemoryReplSet;
  let transactionManager: MongooseTransactionManager;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
    transactionManager = new MongooseTransactionManager();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('should commit transaction on success', async () => {
    const user = User.create('tx-success@example.com', 'Tx Success', 'hash');

    await transactionManager.execute(async (session) => {
      await UserModel.create([
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          passwordHash: user.passwordHash,
          createdAt: user.createdAt,
        },
      ], { session });
    });

    const found = await UserModel.findOne({ id: user.id });
    expect(found).not.toBeNull();
    expect(found?.email).toBe('tx-success@example.com');
  });

  it('should rollback transaction on failure', async () => {
    const user = User.create('tx-rollback@example.com', 'Tx Rollback', 'hash');

    await expect(
      transactionManager.execute(async (session) => {
        await UserModel.create([
          {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            passwordHash: user.passwordHash,
            createdAt: user.createdAt,
          },
        ], { session });

        throw new Error('force rollback');
      })
    ).rejects.toThrow('force rollback');

    const found = await UserModel.findOne({ id: user.id });
    expect(found).toBeNull();
  });
});
