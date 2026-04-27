import jwt from 'jsonwebtoken';
import { JWTService as JWTServicePort } from '@application/ports/JWTService';
import { AuthenticationError } from '@domain/errors/DomainError';

export class JWTService implements JWTServicePort {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '1h'
  ) {}

  async sign(payload: { userId: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret,
        { expiresIn: this.expiresIn as any }, // Type assertion for expiresIn
        (err, token) => {
          if (err || !token) {
            reject(new AuthenticationError('Failed to sign token'));
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  async verify(token: string): Promise<{ userId: string }> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.secret,
        (err, decoded) => {
          if (err) {
            if (err.name === 'TokenExpiredError') {
              reject(new AuthenticationError('Token expired', 'TOKEN_EXPIRED'));
            } else if (err.name === 'JsonWebTokenError') {
              reject(new AuthenticationError('Invalid token', 'INVALID_TOKEN'));
            } else {
              reject(new AuthenticationError('Authentication failed'));
            }
          } else if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            resolve({ userId: decoded.userId as string });
          } else {
            reject(new AuthenticationError('Invalid token payload'));
          }
        }
      );
    });
  }
}