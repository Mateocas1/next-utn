import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { validate } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/auth';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { JWTService } from '@infrastructure/auth/JWTService';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { createChatSchema, chatIdSchema, listChatsSchema } from '../schemas/chat.schemas';

export function createChatRoutes(
  chatController: ChatController,
  jwtService: JWTService,
  idempotencyStore: IdempotencyStore
): Router {
  const router = Router();

  // All chat routes require authentication
  router.use(authMiddleware(jwtService));

  router.post(
    '/',
    idempotencyMiddleware(idempotencyStore),
    validate(createChatSchema, 'body'),
    (req, res, next) => {
      chatController.create(req, res).catch(next);
    }
  );

  router.get(
    '/',
    validate(listChatsSchema, 'query'),
    (req, res, next) => {
      chatController.list(req, res).catch(next);
    }
  );

  router.get(
    '/:chatId',
    validate(chatIdSchema, 'params'),
    (req, res, next) => {
      chatController.getDetails(req, res).catch(next);
    }
  );

  return router;
}