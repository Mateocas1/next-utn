import bcrypt from 'bcrypt';
import { PasswordHasher as PasswordHasherPort } from '@application/ports/PasswordHasher';

export class BcryptPasswordHasher implements PasswordHasherPort {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}