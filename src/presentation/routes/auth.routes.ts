import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

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

  return router;
}