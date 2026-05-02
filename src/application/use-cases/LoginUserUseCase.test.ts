import { LoginUserUseCase } from './LoginUserUseCase';
import { User } from '@domain/entities/User';
import { AuthenticationError } from '@domain/errors/DomainError';
import { UserRepository } from '../ports/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { JWTService } from '../ports/JWTService';

describe('LoginUserUseCase', () => {
  // Test will fail because LoginUserUseCase doesn't exist yet
  // That's the RED phase
  
  it('should return JWT token when credentials are valid', async () => {
    // Arrange
    const passwordHash = '$2b$12$testhash';
    const existingUser = User.create('test@example.com', 'Test User', passwordHash);
    const mockToken = 'jwt-token-123';
    
    const mockUserRepository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    };
    
    const mockPasswordHasher: PasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn().mockResolvedValue(true)
    };
    
    const mockJWTService: JWTService = {
      sign: jest.fn().mockResolvedValue(mockToken),
      verify: jest.fn()
    };
    
    const useCase = new LoginUserUseCase(mockUserRepository, mockPasswordHasher, mockJWTService);
    const input = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    // Act & Assert
    // This will fail because LoginUserUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toEqual({
      token: mockToken,
      type: 'Bearer',
      expiresIn: expect.any(String)
    });
    
    // Verify user was looked up by email
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    // Verify password was compared
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith('Password123!', passwordHash);
    // Verify JWT was signed with userId
    expect(mockJWTService.sign).toHaveBeenCalledWith({ userId: existingUser.id });
  });
  
  it('should throw AuthenticationError when user not found', async () => {
    // Arrange
    const mockUserRepository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    };
    
    const mockPasswordHasher: PasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn()
    };
    
    const mockJWTService: JWTService = {
      sign: jest.fn(),
      verify: jest.fn()
    };
    
    const useCase = new LoginUserUseCase(mockUserRepository, mockPasswordHasher, mockJWTService);
    const input = {
      email: 'nonexistent@example.com',
      password: 'Password123!'
    };
    
    // Act & Assert
    // This will fail because LoginUserUseCase doesn't exist
    await expect(useCase.execute(input)).rejects.toThrow(AuthenticationError);
    
    // Verify password was NOT compared (early exit)
    expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
    // Verify JWT was NOT signed
    expect(mockJWTService.sign).not.toHaveBeenCalled();
  });
  
  it('should throw AuthenticationError when password is incorrect', async () => {
    // Arrange
    const passwordHash = '$2b$12$testhash';
    const existingUser = User.create('test@example.com', 'Test User', passwordHash);
    
    const mockUserRepository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    };
    
    const mockPasswordHasher: PasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn().mockResolvedValue(false) // Password doesn't match
    };
    
    const mockJWTService: JWTService = {
      sign: jest.fn(),
      verify: jest.fn()
    };
    
    const useCase = new LoginUserUseCase(mockUserRepository, mockPasswordHasher, mockJWTService);
    const input = {
      email: 'test@example.com',
      password: 'WrongPassword!'
    };
    
    // Act & Assert
    // This will fail because LoginUserUseCase doesn't exist
    await expect(useCase.execute(input)).rejects.toThrow(AuthenticationError);
    
    // Verify password was compared
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith('WrongPassword!', passwordHash);
    // Verify JWT was NOT signed
    expect(mockJWTService.sign).not.toHaveBeenCalled();
  });
});
