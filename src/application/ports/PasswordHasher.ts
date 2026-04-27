/**
 * PasswordHasher port interface.
 * 
 * Defines the contract for password hashing and verification operations.
 * Implementations are provided by the infrastructure layer.
 */
export interface PasswordHasher {
  /**
   * Hash a plain text password.
   * @param password The plain text password
   * @returns The hashed password
   */
  hash(password: string): Promise<string>;
  
  /**
   * Compare a plain text password with a hash.
   * @param plainPassword The plain text password to check
   * @param hashedPassword The hashed password to compare against
   * @returns True if the password matches, false otherwise
   */
  compare(plainPassword: string, hashedPassword: string): Promise<boolean>;
}