import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { DuplicateEmailError, AuthenticationError } from '@domain/errors/DomainError';
import { AuthController } from './AuthController';

// Mock use cases
jest.mock('@application/use-cases/RegisterUserUseCase');
jest.mock('@application/use-cases/LoginUserUseCase');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRegisterUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUserUseCase>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    (RegisterUserUseCase as jest.MockedClass<typeof RegisterUserUseCase>).mockClear();
    (LoginUserUseCase as jest.MockedClass<typeof LoginUserUseCase>).mockClear();
    
    // Create mock instances
    mockRegisterUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RegisterUserUseCase>;
    
    mockLoginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUserUseCase>;
    
    // Create controller with mocked use cases
    authController = new AuthController(mockRegisterUseCase, mockLoginUseCase);
    
    // Setup request/response mocks
    mockReq = {
      body: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    it('should return 201 with user data on successful registration', async () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
      };
      
      mockReq.body = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'SecurePass123!',
      };
      
      mockRegisterUseCase.execute.mockResolvedValue(userData);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'SecurePass123!',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: userData,
      });
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        displayName: 'Existing User',
        password: 'SecurePass123!',
      };
      
      mockRegisterUseCase.execute.mockRejectedValue(
        new DuplicateEmailError()
      );

      await expect(authController.register(mockReq as Request, mockRes as Response))
        .rejects.toThrow(DuplicateEmailError);
    });

    it('should propagate validation errors to error handler', async () => {
      mockReq.body = {
        email: 'invalid-email',
        displayName: 'T', // Too short
        password: 'weak',
      };
      
      mockRegisterUseCase.execute.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(authController.register(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('login', () => {
    it('should return 200 with token on successful login', async () => {
      const loginResult = {
        token: 'jwt-token-123',
        type: 'Bearer' as const,
        expiresIn: '1h',
      };
      
      mockReq.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: loginResult,
      });
    });

    it('should throw AuthenticationError on invalid credentials', async () => {
      mockReq.body = {
        email: 'wrong@example.com',
        password: 'WrongPass123!',
      };
      
      mockLoginUseCase.execute.mockRejectedValue(
        new AuthenticationError('Invalid email or password')
      );

      await expect(authController.login(mockReq as Request, mockRes as Response))
        .rejects.toThrow(AuthenticationError);
    });

    it('should propagate validation errors to error handler for login', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: '',
      };
      
      mockLoginUseCase.execute.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(authController.login(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Validation failed');
    });
  });
});