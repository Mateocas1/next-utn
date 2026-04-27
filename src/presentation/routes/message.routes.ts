import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { validate } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/auth';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { JWTService } from '@infrastructure/auth/JWTService';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { sendMessageSchema, getMessageHistorySchema } from '../schemas/message.schemas';

export function createMessageRoutes(
  messageController: MessageController,
  jwtService: JWTService,
  idempotencyStore: IdempotencyStore
): Router {
  const router = Router();

  // All message routes require authentication
  router.use(authMiddleware(jwtService));

  router.post(
    '/',
    validate(sendMessageSchema, 'body'),
    idempotencyMiddleware(idempotencyStore),
    (req, res, next) => {
      messageController.send(req, res).catch(next);
    }
  );

  router.get(
    '/',
    validate(getMessageHistorySchema, 'query'),
    (req, res, next) => {
      messageController.getHistory(req, res).catch(next);
    }
  );

  return router;
}