import { Request, Response, NextFunction } from 'express';
import { JWTService } from '@infrastructure/auth/JWTService';
import { UserRepository } from '@application/ports/UserRepository';
import { errorResponse } from '../utils/response';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  jwtService: JWTService,
  userRepository: Pick<UserRepository, 'findById'>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      res.status(401).json(
        errorResponse('Authentication required', 'AUTHENTICATION_REQUIRED')
      );
      return;
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json(
        errorResponse('Authentication required', 'AUTHENTICATION_REQUIRED')
      );
      return;
    }

    const token = parts[1];
    
    jwtService.verify(token)
      .then(async payload => {
        const user = await userRepository.findById(payload.userId);

        if (!user) {
          res.status(401).json(
            errorResponse('Invalid token', 'INVALID_TOKEN')
          );
          return;
        }

        req.userId = payload.userId;
        next();
      })
      .catch(error => {
        if (error instanceof Error && 'errorCode' in error) {
          const domainError = error as { errorCode: string; message: string };
          
          let errorCode = 'AUTHENTICATION_ERROR';
          if (domainError.errorCode === 'TOKEN_EXPIRED') {
            errorCode = 'TOKEN_EXPIRED';
          } else if (domainError.errorCode === 'INVALID_TOKEN') {
            errorCode = 'INVALID_TOKEN';
          }

          res.status(401).json(
            errorResponse(domainError.message, errorCode)
          );
        } else {
          res.status(401).json(
            errorResponse('Authentication failed', 'AUTHENTICATION_ERROR')
          );
        }
      });
  };
}
