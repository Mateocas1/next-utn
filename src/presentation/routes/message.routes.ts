import { Router } from 'express';
import { z } from 'zod';
import { MessageController } from '../controllers/MessageController';
import { validate } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/auth';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { JWTService } from '@infrastructure/auth/JWTService';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { UserRepository } from '@application/ports/UserRepository';
import { sendMessageSchema, getMessageHistorySchema } from '../schemas/message.schemas';

export function createMessageRoutes(
  messageController: MessageController,
  jwtService: JWTService,
  idempotencyStore: IdempotencyStore,
  userRepository: Pick<UserRepository, 'findById'>
): Router {
  const router = Router();

  // All message routes require authentication
  router.use(authMiddleware(jwtService, userRepository));

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

// Endpoint para notificar "usuario escribiendo..."
router.post(
  '/typing',
  validate(
    z.object({
      chatId: z.string().uuid(),
    isTyping: z.boolean(),
    }),
    'body'
  ),
  (req, res, next) => {
    messageController.notifyTyping(req, res).catch(next);
  }
);

  return router;
}
