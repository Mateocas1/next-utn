import { User } from '@domain/entities/User';
import { DuplicateEmailError } from '@domain/errors/DomainError';
import { UserRepository } from '../ports/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';

export interface RegisterUserInput {
  email: string;
  displayName: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

/**
 * RegisterUserUseCase - Handles user registration.
 * 
 * Validates email uniqueness, hashes password, and creates user.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new DuplicateEmailError();
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // Create user entity
    const user = await User.create(input.email, input.displayName, passwordHash);

    // Save user
    const savedUser = await this.userRepository.create(user);

    // Return output (excluding password hash)
    return {
      id: savedUser.id,
      email: savedUser.email,
      displayName: savedUser.displayName,
      createdAt: savedUser.createdAt
    };
  }
}