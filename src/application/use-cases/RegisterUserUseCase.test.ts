import { RegisterUserUseCase } from './RegisterUserUseCase';
import { User } from '@domain/entities/User';
import { DuplicateEmailError } from '@domain/errors/DomainError';
import { UserRepository } from '../ports/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';

describe('RegisterUserUseCase', () => {
  // Test will fail because RegisterUserUseCase doesn't exist yet
  // That's the RED phase
  
  it('should create a new user when email is unique', async () => {
    // Arrange
    const mockUserRepository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (user) => user),
      findById: jest.fn().mockResolvedValue(null)
    };
    
    const mockPasswordHasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hashed-password-123'),
      compare: jest.fn()
    };
    
    const useCase = new RegisterUserUseCase(mockUserRepository, mockPasswordHasher);
    const input = {
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'Password123!'
    };
    
    // Act & Assert
    // This will fail because RegisterUserUseCase doesn't exist
    await expect(useCase.execute(input)).resolves.toMatchObject({
      id: expect.any(String),
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: expect.any(Date)
    });
    
    // Verify password was hashed
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('Password123!');
    // Verify user was created with hashed password
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: 'hashed-password-123'
      })
    );
  });
  
  it('should throw DuplicateEmailError when email already exists', async () => {
    // Arrange
    const existingUser = User.create('test@example.com', 'Existing User', 'Password123!');
    const mockUserRepository: UserRepository = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn().mockImplementation(async (user) => user),
      findById: jest.fn().mockResolvedValue(null)
    };
    
    const mockPasswordHasher: PasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn()
    };
    
    const useCase = new RegisterUserUseCase(mockUserRepository, mockPasswordHasher);
    const input = {
      email: 'test@example.com', // Same email
      displayName: 'New User',
      password: 'Password123!'
    };
    
    // Act & Assert
    // This will fail because RegisterUserUseCase doesn't exist
    await expect(useCase.execute(input)).rejects.toThrow(DuplicateEmailError);
    
    // Verify password was NOT hashed (early exit)
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    // Verify user was NOT created
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});