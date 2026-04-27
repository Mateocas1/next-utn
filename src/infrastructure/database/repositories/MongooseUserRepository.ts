import { User } from '@domain/entities/User';
import { UserRepository } from '@application/ports/UserRepository';
import { UserModel } from '../models/UserModel';

export class MongooseUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ email });
    if (!userDoc) {
      return null;
    }

    return User.reconstruct({
      id: userDoc.id,
      email: userDoc.email,
      displayName: userDoc.displayName,
      passwordHash: userDoc.passwordHash,
      createdAt: userDoc.createdAt,
    });
  }

  async create(user: User): Promise<User> {
    const userDoc = new UserModel({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    });

    await userDoc.save();
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ id });
    if (!userDoc) {
      return null;
    }

    return User.reconstruct({
      id: userDoc.id,
      email: userDoc.email,
      displayName: userDoc.displayName,
      passwordHash: userDoc.passwordHash,
      createdAt: userDoc.createdAt,
    });
  }
}