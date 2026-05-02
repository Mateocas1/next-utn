import { User } from '@domain/entities/User';
import type { UserRepository } from './UserRepository';

/**
 * UserRepository port interface tests.
 * 
 * These tests verify the contract that any UserRepository implementation must satisfy.
 * We test by creating a mock implementation that must satisfy the interface.
 */
describe('UserRepository port interface', () => {
  // Test 1: Interface should have findByEmail method with correct signature
  it('should define findByEmail method that returns Promise<User | null>', () => {
    // This test will fail at compile time if interface doesn't exist
    // We create a mock that should satisfy the interface
    const mockRepository: UserRepository = {
      findByEmail: async (email: string): Promise<User | null> => {
        return null; // Implementation doesn't matter for type test
      },
      create: async (user: User): Promise<User> => {
        return user;
      },
      findById: async (id: string): Promise<User | null> => {
        return null;
      },
      findAll: async (): Promise<User[]> => {
        return [];
      },
      delete: async (_id: string): Promise<void> => {
        return;
      },
    };
    
    // The assertion is that TypeScript compiles this without error
    // If it compiles, the interface has the right shape
    expect(mockRepository).toBeDefined();
    expect(typeof mockRepository.findByEmail).toBe('function');
  });
  
  // Test 2: Interface should have create method
  it('should define create method that returns Promise<User>', () => {
    const mockRepository: UserRepository = {
      findByEmail: async () => null,
      create: async (user: User): Promise<User> => user,
      findById: async () => null,
      findAll: async () => [],
      delete: async (_id: string) => {
        return;
      },
    };
    
    expect(typeof mockRepository.create).toBe('function');
  });
  
  // Test 3: Interface should have findById method  
  it('should define findById method that returns Promise<User | null>', () => {
    const mockRepository: UserRepository = {
      findByEmail: async () => null,
      create: async (user: User) => user,
      findById: async (id: string): Promise<User | null> => null,
      findAll: async (): Promise<User[]> => [],
      delete: async (_id: string): Promise<void> => {
        return;
      },
    };
    
    expect(typeof mockRepository.findById).toBe('function');
  });
});
