import mongoose from 'mongoose';
import { TransactionManager } from '@application/ports/TransactionManager';

export class MongooseTransactionManager implements TransactionManager {
  async execute<T>(operation: (session: any) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();

    try {
      let result: T | undefined;

      await session.withTransaction(async () => {
        result = await operation(session);
      });

      return result as T;
    } finally {
      await session.endSession();
    }
  }
}
