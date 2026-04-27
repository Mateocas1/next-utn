import { User } from './User';

describe('User', () => {
  describe('create', () => {
    it('should create a valid user with provided password hash', () => {
      const passwordHash = '$2b$12$testhash1234567890abcdefghijklmnopqrstuvwxyz';
      const user = User.create('test@example.com', 'Test User', passwordHash);
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.passwordHash).toBe(passwordHash);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should reject invalid email format', () => {
      const passwordHash = '$2b$12$testhash';
      expect(() => User.create('invalid-email', 'Test User', passwordHash))
        .toThrow('Invalid email format');
    });

    it('should reject empty password hash', () => {
      expect(() => User.create('test@example.com', 'Test User', ''))
        .toThrow('Password hash is required');
    });

    it('should create user with valid email variations', () => {
      const passwordHash = '$2b$12$testhash';
      const user1 = User.create('user.name@example.com', 'Test User', passwordHash);
      expect(user1.email).toBe('user.name@example.com');
      
      const user2 = User.create('user+tag@example.com', 'Test User', passwordHash);
      expect(user2.email).toBe('user+tag@example.com');
    });
  });

  // Note: hashPassword and verifyPassword moved to infrastructure layer
  // via PasswordHasher port
});