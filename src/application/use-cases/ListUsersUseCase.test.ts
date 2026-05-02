import { User } from '@domain/entities/User';
import { UserRepository } from '../ports/UserRepository';
import { ListUsersUseCase } from './ListUsersUseCase';

describe('ListUsersUseCase', () => {
  it('should return all users from repository', async () => {
    const users = [
      User.create('one@example.com', 'One', 'hash-one'),
      User.create('two@example.com', 'Two', 'hash-two'),
    ];

    const userRepository: UserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue(users),
      delete: jest.fn(),
    };

    const useCase = new ListUsersUseCase(userRepository);

    await expect(useCase.execute()).resolves.toEqual(users);
    expect(userRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no users exist', async () => {
    const userRepository: UserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    };

    const useCase = new ListUsersUseCase(userRepository);
    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(userRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
