import axios from 'axios';
import { authStore } from '../features/auth/store/authStore';

// Mock the authStore getState method
jest.mock('../features/auth/store/authStore', () => ({
  authStore: {
    getState: () => ({
      token: 'test-token',
      clearAuth: jest.fn(),
    }),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-idempotency-key',
}));

describe('axios interceptors', () => {
  let mockClearAuth: jest.Mock;
  
  beforeEach(() => {
    mockClearAuth = jest.fn();
    (authStore as any).getState = () => ({
      token: 'test-token',
      clearAuth: mockClearAuth,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add authorization header when token exists', async () => {
    // Import the actual axios instance to test the interceptors
    const axiosInstance = require('./axios').default;
    
    // Create a mock config to test the request interceptor
    const config: any = { headers: {} };
    
    // Manually test the request interceptor by calling it directly
    const requestInterceptor = axiosInstance.interceptors.request.handlers[0].fulfilled;
    const result = await requestInterceptor(config);
    
    expect(result.headers['Authorization']).toBe('Bearer test-token');
  });

  it('should add idempotency key for POST requests', async () => {
    const axiosInstance = require('./axios').default;
    
    // Create a mock config to test the request interceptor
    const config: any = { 
      method: 'POST',
      headers: {} 
    };
    
    // Manually test the request interceptor by calling it directly
    const requestInterceptor = axiosInstance.interceptors.request.handlers[0].fulfilled;
    const result = await requestInterceptor(config);
    
    expect(result.headers['Idempotency-Key']).toBe('test-idempotency-key');
  });

  it('should clear auth on 401 response', async () => {
    const axiosInstance = require('./axios').default;
    
    // Manually test the response interceptor by calling it directly
    const responseInterceptor = axiosInstance.interceptors.response.handlers[0].rejected;
    
    const error: any = { 
      response: {
        status: 401
      }
    };
    
    try {
      await responseInterceptor(error);
    } catch (e) {
      // Expected to reject the error
    }
    
    // Check that clearAuth was called
    expect(mockClearAuth).toHaveBeenCalled();
  });
});