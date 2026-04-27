import { AuthenticationError } from '@domain/errors/DomainError';
import { UserRepository } from '../ports/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { JWTService } from '../ports/JWTService';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  token: string;
  type: 'Bearer';
  expiresIn: string;
}

/**
 * LoginUserUseCase - Handles user authentication.
 * 
 * Validates credentials and returns JWT token upon success.
 * Throws generic AuthenticationError on failure (never reveals which field is wrong).
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JWTService
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError();
    }

    // Verify password
    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash
    );
    
    if (!passwordMatches) {
      throw new AuthenticationError();
    }

    // Generate JWT token
    const token = await this.jwtService.sign({ userId: user.id });

    // Return token response
    return {
      token,
      type: 'Bearer',
      expiresIn: '1h' // TODO: Make configurable
    };
  }
}