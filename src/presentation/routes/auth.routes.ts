import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';
import { deleteUserParamsSchema, listUsersQuerySchema } from '../schemas/users.schemas';
import { authMiddleware } from '../middlewares/auth';
import { JWTService } from '@infrastructure/auth/JWTService';
import { UserRepository } from '@application/ports/UserRepository';

export function createAuthRoutes(
  authController: AuthController,
  jwtService: JWTService,
  userRepository: Pick<UserRepository, 'findById'>
): Router {
  const router = Router();

  router.post(
    '/',
    validate(registerSchema, 'body'),
    (req, res, next) => {
      authController.register(req, res).catch(next);
    }
  );

  router.post(
    '/register',
    validate(registerSchema, 'body'),
    (req, res, next) => {
      authController.register(req, res).catch(next);
    }
  );

  router.post(
    '/login',
    validate(loginSchema, 'body'),
    (req, res, next) => {
      authController.login(req, res).catch(next);
    }
  );

  router.get(
    '/',
    validate(listUsersQuerySchema, 'query'),
    (req, res, next) => {
      authController.listUsers(req, res).catch(next);
    }
  );

  router.delete(
    '/:id',
    authMiddleware(jwtService, userRepository),
    validate(deleteUserParamsSchema, 'params'),
    (req, res, next) => {
      authController.deleteUser(req, res).catch(next);
    }
  );

  return router;
}
