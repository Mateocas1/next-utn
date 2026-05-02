import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Notification } from '@domain/entities/Notification';
import { NotificationModel } from '../models/NotificationModel';
import { MongooseNotificationRepository } from './MongooseNotificationRepository';

describe('MongooseNotificationRepository', () => {
  let mongoServer: MongoMemoryReplSet;
  let repository: MongooseNotificationRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
    repository = new MongooseNotificationRepository(NotificationModel);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await NotificationModel.deleteMany({});
  });

  it('should delete notifications by user id', async () => {
    const n1 = new Notification('u-target', 't1', 'm1');
    const n2 = new Notification('u-target', 't2', 'm2');
    const n3 = new Notification('u-other', 't3', 'm3');
    await repository.save(n1);
    await repository.save(n2);
    await repository.save(n3);

    await repository.deleteByUserId('u-target');

    const target = await repository.findByUserId('u-target');
    const other = await repository.findByUserId('u-other');
    expect(target).toHaveLength(0);
    expect(other).toHaveLength(1);
  });
});
