import { randomUUID } from 'crypto';

export interface UserProps {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(email: string, displayName: string, passwordHash: string): User {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password hash is not empty
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new Error('Password hash is required');
    }
    
    return new User({
      id: randomUUID(),
      email,
      displayName,
      passwordHash,
      createdAt: new Date(),
    });
  }

  static verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    // This method is kept for backward compatibility but should be implemented
    // in infrastructure layer via PasswordHasher port
    throw new Error('Use PasswordHasher.compare() instead');
  }

  /**
   * Reconstruct a User from persisted data.
   * Used by repositories to hydrate entities from database.
   */
  static reconstruct(props: UserProps): User {
    return new User(props);
  }
}