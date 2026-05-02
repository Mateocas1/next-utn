import { User } from '@domain/entities/User';
import { UserRepository } from '@application/ports/UserRepository';

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
