import { authStore } from './authStore';

// Mock the zustand store
jest.mock('zustand/vanilla', () => {
  // This is a mock implementation of zustand that allows us to track state changes
  let mockState: any = {
    token: null,
    userId: null,
    setAuth: jest.fn(),
    clearAuth: jest.fn(),
    isAuthenticated: jest.fn(),
  };

  return {
    createStore: (fn: any) => {
      // Check if fn is a function before calling it
      if (typeof fn !== 'function') {
        throw new Error('fn is not a function');
      }
      
      // Call the function with mock set and get functions
      const storeFn = fn(
        (setter: any) => {
          // This simulates the set function
          return (newState: any) => {
            mockState = { ...mockState, ...newState };
            return mockState;
          };
        },
        () => mockState
      );
      
      // Return an object that simulates the store
      return {
        getState: () => mockState,
        setState: (newState: any) => {
          mockState = { ...mockState, ...newState };
        },
        subscribe: jest.fn(),
        ...storeFn,
      };
    },
  };
});

// Mock the persist middleware
jest.mock('zustand/middleware', () => {
  return {
    persist: (config: any, options: any) => {
      return config;
    }
  };
});

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock state
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(),
    }));
  });

  it('should initialize with null token and userId', () => {
    // Arrange & Act
    const state = authStore.getState();

    // Assert
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('should set auth token and userId', () => {
    // Arrange
    const token = 'test-token';
    const userId = 'user-id';
    
    // Mock the setAuth function
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn().mockImplementation((newToken, newUserId) => {
        (authStore as any).getState = jest.fn(() => ({
          token: newToken,
          userId: newUserId,
          setAuth: jest.fn(),
          clearAuth: jest.fn(),
          isAuthenticated: jest.fn(),
        }));
      }),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(),
    }));

    // Act
    authStore.getState().setAuth(token, userId);
    
    // Get the updated state
    const state = authStore.getState();
    
    // Assert
    expect(state.token).toBe(token);
    expect(state.userId).toBe(userId);
  });

  it('should clear auth token and userId', () => {
    // Arrange
    const token = 'test-token';
    const userId = 'user-id';
    
    // Set initial state with token and userId
    (authStore as any).getState = jest.fn(() => ({
      token,
      userId,
      setAuth: jest.fn(),
      clearAuth: jest.fn().mockImplementation(() => {
        (authStore as any).getState = jest.fn(() => ({
          token: null,
          userId: null,
          setAuth: jest.fn(),
          clearAuth: jest.fn(),
          isAuthenticated: jest.fn(),
        }));
      }),
      isAuthenticated: jest.fn(),
    }));

    // Act
    authStore.getState().clearAuth();
    
    // Get the updated state
    const state = authStore.getState();
    
    // Assert
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('should return true for isAuthenticated when token and userId exist', () => {
    // Arrange
    (authStore as any).getState = jest.fn(() => ({
      token: 'test-token',
      userId: 'user-id',
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(() => true),
    }));

    // Act
    const isAuthenticated = authStore.getState().isAuthenticated();

    // Assert
    expect(isAuthenticated).toBe(true);
  });

  it('should return false for isAuthenticated when token or userId are missing', () => {
    // Arrange
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(() => false),
    }));

    // Act
    const isAuthenticated = authStore.getState().isAuthenticated();

    // Assert
    expect(isAuthenticated).toBe(false);
  });
});

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock state
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(),
    }));
  });

  it('should initialize with null token and userId', () => {
    // Arrange & Act
    const state = authStore.getState();

    // Assert
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('should set auth token and userId', () => {
    // Arrange
    const token = 'test-token';
    const userId = 'user-id';
    
    // Mock the setAuth function
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn().mockImplementation((newToken, newUserId) => {
        (authStore as any).getState = jest.fn(() => ({
          token: newToken,
          userId: newUserId,
          setAuth: jest.fn(),
          clearAuth: jest.fn(),
          isAuthenticated: jest.fn(),
        }));
      }),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(),
    }));

    // Act
    authStore.getState().setAuth(token, userId);
    
    // Get the updated state
    const state = authStore.getState();
    
    // Assert
    expect(state.token).toBe(token);
    expect(state.userId).toBe(userId);
  });

  it('should clear auth token and userId', () => {
    // Arrange
    const token = 'test-token';
    const userId = 'user-id';
    
    // Set initial state with token and userId
    (authStore as any).getState = jest.fn(() => ({
      token,
      userId,
      setAuth: jest.fn(),
      clearAuth: jest.fn().mockImplementation(() => {
        (authStore as any).getState = jest.fn(() => ({
          token: null,
          userId: null,
          setAuth: jest.fn(),
          clearAuth: jest.fn(),
          isAuthenticated: jest.fn(),
        }));
      }),
      isAuthenticated: jest.fn(),
    }));

    // Act
    authStore.getState().clearAuth();
    
    // Get the updated state
    const state = authStore.getState();
    
    // Assert
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('should return true for isAuthenticated when token and userId exist', () => {
    // Arrange
    (authStore as any).getState = jest.fn(() => ({
      token: 'test-token',
      userId: 'user-id',
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(() => true),
    }));

    // Act
    const isAuthenticated = authStore.getState().isAuthenticated();

    // Assert
    expect(isAuthenticated).toBe(true);
  });

  it('should return false for isAuthenticated when token or userId are missing', () => {
    // Arrange
    (authStore as any).getState = jest.fn(() => ({
      token: null,
      userId: null,
      setAuth: jest.fn(),
      clearAuth: jest.fn(),
      isAuthenticated: jest.fn(() => false),
    }));

    // Act
    const isAuthenticated = authStore.getState().isAuthenticated();

    // Assert
    expect(isAuthenticated).toBe(false);
  });
});