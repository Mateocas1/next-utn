import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase';
import { DeleteUserUseCase } from '@application/use-cases/DeleteUserUseCase';
import { DuplicateEmailError, AuthenticationError } from '@domain/errors/DomainError';
import { AuthController } from './AuthController';

// Mock use cases
jest.mock('@application/use-cases/RegisterUserUseCase');
jest.mock('@application/use-cases/LoginUserUseCase');
jest.mock('@application/use-cases/ListUsersUseCase');
jest.mock('@application/use-cases/DeleteUserUseCase');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRegisterUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUserUseCase>;
  let mockListUsersUseCase: jest.Mocked<ListUsersUseCase>;
  let mockDeleteUserUseCase: jest.Mocked<DeleteUserUseCase>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    (RegisterUserUseCase as jest.MockedClass<typeof RegisterUserUseCase>).mockClear();
    (LoginUserUseCase as jest.MockedClass<typeof LoginUserUseCase>).mockClear();
    (ListUsersUseCase as jest.MockedClass<typeof ListUsersUseCase>).mockClear();
    (DeleteUserUseCase as jest.MockedClass<typeof DeleteUserUseCase>).mockClear();
    
    // Create mock instances
    mockRegisterUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RegisterUserUseCase>;
    
    mockLoginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUserUseCase>;

    mockListUsersUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListUsersUseCase>;

    mockDeleteUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteUserUseCase>;
    
    // Create controller with mocked use cases
    authController = new AuthController(
      mockRegisterUseCase,
      mockLoginUseCase,
      mockListUsersUseCase,
      mockDeleteUserUseCase
    );
    
    // Setup request/response mocks
    mockReq = {
      body: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
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

  describe('listUsers', () => {
    it('should return 200 with user list', async () => {
      const users = [
        {
          id: 'user-1',
          email: 'one@example.com',
          displayName: 'One',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      mockListUsersUseCase.execute.mockResolvedValue(users as any);

      await authController.listUsers(mockReq as Request, mockRes as Response);

      expect(mockListUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: users,
      });
    });
  });

  describe('deleteUser', () => {
    it('should return 204 on successful delete', async () => {
      mockReq.params = { id: '8f41d674-fa61-4f71-9377-f74f8dc8a622' };
      mockDeleteUserUseCase.execute.mockResolvedValue(undefined);

      await authController.deleteUser(mockReq as Request, mockRes as Response);

      expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith({
        userId: '8f41d674-fa61-4f71-9377-f74f8dc8a622',
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledTimes(1);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
