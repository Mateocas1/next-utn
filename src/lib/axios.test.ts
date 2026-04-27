import axiosInstance from './axios';
import { authStore } from '../features/auth/store/authStore';
import { v4 as uuidv4 } from 'uuid';

// Mock axios and uuid
jest.mock('axios');
jest.mock('uuid');

const mockedAxios = axiosInstance as any;
const mockedUuid = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('Axios interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUuid.mockReturnValue('uuid-value' as any);
  });

  describe('Request interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      // Arrange
      const token = 'test-token';
      const config = {
        headers: {},
      };
      
      // Mock auth store to return a token
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token,
        userId: 'user-id',
        setAuth: jest.fn(),
        clearAuth: jest.fn(),
        isAuthenticated: jest.fn(),
      } as any);

      // Act
      const result = await mockedAxios.interceptors.request.handlers[0].fulfilled(config);

      // Assert
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add Authorization header when token is null', async () => {
      // Arrange
      const config = {
        headers: {},
      };
      
      // Mock auth store to return null token
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token: null,
        userId: null,
        setAuth: jest.fn(),
        clearAuth: jest.fn(),
        isAuthenticated: jest.fn(),
      } as any);

      // Act
      const result = await mockedAxios.interceptors.request.handlers[0].fulfilled(config);

      // Assert
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add Idempotency-Key header for POST requests', async () => {
      // Arrange
      const config = {
        method: 'POST',
        headers: {},
      };
      
      // Mock auth store
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token: null,
        userId: null,
        setAuth: jest.fn(),
        clearAuth: jest.fn(),
        isAuthenticated: jest.fn(),
      } as any);

      // Act
      const result = await mockedAxios.interceptors.request.handlers[0].fulfilled(config);

      // Assert
      expect(result.headers['Idempotency-Key']).toBe('uuid-value');
    });

    it('should not add Idempotency-Key header for non-POST requests', async () => {
      // Arrange
      const config = {
        method: 'GET',
        headers: {},
      };
      
      // Mock auth store
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token: null,
        userId: null,
        setAuth: jest.fn(),
        clearAuth: jest.fn(),
        isAuthenticated: jest.fn(),
      } as any);

      // Act
      const result = await mockedAxios.interceptors.request.handlers[0].fulfilled(config);

      // Assert
      expect(result.headers['Idempotency-Key']).toBeUndefined();
    });
  });

  describe('Response interceptor', () => {
    it('should clear auth store on 401 Unauthorized response', async () => {
      // Arrange
      const error = {
        response: {
          status: 401,
        },
      };
      
      // Mock clearAuth function
      const clearAuthMock = jest.fn();
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token: null,
        userId: null,
        setAuth: jest.fn(),
        clearAuth: clearAuthMock,
        isAuthenticated: jest.fn(),
      } as any);

      // Act & Assert
      await expect(
        mockedAxios.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      // Verify clearAuth was called
      expect(clearAuthMock).toHaveBeenCalled();
    });

    it('should not clear auth store on non-401 responses', async () => {
      // Arrange
      const error = {
        response: {
          status: 500,
        },
      };
      
      // Mock clearAuth function
      const clearAuthMock = jest.fn();
      jest.spyOn(authStore, 'getState').mockReturnValue({
        token: null,
        userId: null,
        setAuth: jest.fn(),
        clearAuth: clearAuthMock,
        isAuthenticated: jest.fn(),
      } as any);

      // Act & Assert
      await expect(
        mockedAxios.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      // Verify clearAuth was not called
      expect(clearAuthMock).not.toHaveBeenCalled();
    });
  });
});