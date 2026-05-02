import { User } from '@domain/entities/User';

/**
 * UserRepository port interface.
 * 
 * Defines the contract for user persistence operations.
 * Implementations are provided by the infrastructure layer.
 */
export interface UserRepository {
  /**
   * Find a user by email address.
   * @param email The email address to search for
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Create a new user.
   * @param user The user entity to persist
   * @returns The created user with generated ID
   */
  create(user: User): Promise<User>;
  
  /**
   * Find a user by ID.
   * @param id The user ID
   * @returns The user if found, null otherwise
   */
  findById(id: string, session?: any): Promise<User | null>;

  findAll(): Promise<User[]>;

  delete(id: string, session?: any): Promise<void>;
}
