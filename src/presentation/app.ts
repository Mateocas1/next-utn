import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { loggerMiddleware } from './middlewares/logger';
import { circuitBreakerMiddleware } from './middlewares/circuitBreaker';
import { rateLimiterMiddleware } from './middlewares/rateLimiter';
import { idempotencyMiddleware } from './middlewares/idempotency';
import { createAuthRoutes } from './routes/auth.routes';
import { createChatRoutes } from './routes/chat.routes';
import { createMessageRoutes } from './routes/message.routes';
import { AuthController } from './controllers/AuthController';
import { ChatController } from './controllers/ChatController';
import { MessageController } from './controllers/MessageController';
import { RegisterUserUseCase } from '@application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/LoginUserUseCase';
import { CreateChatUseCase } from '@application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from '@application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from '@application/use-cases/GetChatDetailsUseCase';
import { SendMessageUseCase } from '@application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from '@application/use-cases/GetMessageHistoryUseCase';
import { JWTService } from '@infrastructure/auth/JWTService';
import { RateLimiter } from '@application/ports/RateLimiter';
import { IdempotencyStore } from '@application/ports/IdempotencyStore';
import { getEnv } from '@config/env';

export function createApp(
  registerUserUseCase: RegisterUserUseCase,
  loginUserUseCase: LoginUserUseCase,
  createChatUseCase: CreateChatUseCase,
  listChatsUseCase: ListChatsUseCase,
  getChatDetailsUseCase: GetChatDetailsUseCase,
  sendMessageUseCase: SendMessageUseCase,
  getMessageHistoryUseCase: GetMessageHistoryUseCase,
  jwtService: JWTService,
  rateLimiter: RateLimiter,
  idempotencyStore: IdempotencyStore
): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Aumentar límite para JSON
  app.use(express.urlencoded({ extended: true })); // Para formularios
  app.use(loggerMiddleware());
  app.use(circuitBreakerMiddleware());
  app.use(rateLimiterMiddleware(rateLimiter));

  // Create controllers
  const authController = new AuthController(registerUserUseCase, loginUserUseCase);
  const chatController = new ChatController(
    createChatUseCase,
    listChatsUseCase,
    getChatDetailsUseCase
  );
  const messageController = new MessageController(
    sendMessageUseCase,
    getMessageHistoryUseCase
  );

// Routes
app.use('/api/users', createAuthRoutes(authController));
app.use('/api/chats', createChatRoutes(chatController, jwtService, idempotencyStore));
app.use('/api/messages', createMessageRoutes(messageController, jwtService, idempotencyStore));

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}