"use strict";

import { io, Socket } from 'socket.io-client';
import { Server } from 'http';
import { createApp } from '../../../src/presentation/app';
import { mongoDBConnection } from '../../../src/infrastructure/database/connection';
import { redisConnection } from '../../../src/infrastructure/redis/connection';
import { JWTService } from '../../../src/infrastructure/auth/JWTService';
import { BcryptPasswordHasher } from '../../../src/infrastructure/auth/BcryptPasswordHasher';
import { MongooseUserRepository } from '../../../src/infrastructure/database/repositories/MongooseUserRepository';
import { MongooseChatRepository } from '../../../src/infrastructure/database/repositories/MongooseChatRepository';
import { MongooseMessageRepository } from '../../../src/infrastructure/database/repositories/MongooseMessageRepository';
import { RegisterUserUseCase } from '../../../src/application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../src/application/use-cases/LoginUserUseCase';
import { CreateChatUseCase } from '../../../src/application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from '../../../src/application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from '../../../src/application/use-cases/GetChatDetailsUseCase';
import { SendMessageUseCase } from '../../../src/application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from '../../../src/application/use-cases/GetMessageHistoryUseCase';
import { NotifyUserTypingUseCase } from '../../../src/application/use-cases/NotifyUserTypingUseCase';
import { InMemoryEventBus } from '../../../src/infrastructure/events/InMemoryEventBus';
import { RedisRateLimiter } from '../../../src/infrastructure/redis/RedisRateLimiter';
import { RedisIdempotencyStore } from '../../../src/infrastructure/redis/RedisIdempotencyStore';
import { getEnv } from '../../../src/config/env';
import { WebSocketGateway } from '../../../src/infrastructure/websocket/gateway';

const config = getEnv();

describe('WebSocket E2E Tests', () => {
  let server: Server;
  let httpServer: any;
  let jwtService: JWTService;
  let socket: Socket;
  let userRepository: MongooseUserRepository;
  let chatRepository: MongooseChatRepository;
  let messageRepository: MongooseMessageRepository;
  let token: string;
  let chatId: string;
  let userId: string;

  beforeAll(async () => {
    // Conectar a MongoDB y Redis
    await mongoDBConnection.connect();
    await redisConnection.connect();

    // Crear servicios
    jwtService = new JWTService(config.JWT_SECRET, config.JWT_EXPIRES_IN);
    const passwordHasher = new BcryptPasswordHasher();
    const eventBus = new InMemoryEventBus();
    const rateLimiter = new RedisRateLimiter(redisConnection.getClient(), config.RATE_LIMIT_MAX, config.RATE_LIMIT_WINDOW);
    const idempotencyStore = new RedisIdempotencyStore(redisConnection.getClient(), config.IDEMPOTENCY_TTL);

    // Crear repositorios
    userRepository = new MongooseUserRepository();
    chatRepository = new MongooseChatRepository();
    messageRepository = new MongooseMessageRepository();

    // Crear casos de uso
    const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
    const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, jwtService);
    const createChatUseCase = new CreateChatUseCase(chatRepository);
    const listChatsUseCase = new ListChatsUseCase(chatRepository);
    const getChatDetailsUseCase = new GetChatDetailsUseCase(chatRepository);
    const sendMessageUseCase = new SendMessageUseCase(chatRepository, messageRepository, eventBus);
    const getMessageHistoryUseCase = new GetMessageHistoryUseCase(chatRepository, messageRepository);
    const notifyUserTypingUseCase = new NotifyUserTypingUseCase(chatRepository, eventBus);

    // Crear app
    const app = createApp(
      registerUserUseCase,
      loginUserUseCase,
      createChatUseCase,
      listChatsUseCase,
      getChatDetailsUseCase,
      sendMessageUseCase,
      getMessageHistoryUseCase,
      jwtService,
      rateLimiter,
      idempotencyStore
    );

    // Crear servidor HTTP
    httpServer = app.listen(0); // Puerto aleatorio
    const port = (httpServer.address() as any).port;

    // Inicializar Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    io.adapter(createAdapter(redisConnection.getClient()));
    io.use(socketIOMiddleware(jwtService));
    const webSocketGateway = new WebSocketGateway(io);
    webSocketGateway.subscribe(eventBus);

    server = httpServer;

    // Crear usuario de prueba
    const user = await registerUserUseCase.execute({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    });
    userId = user.id;

    // Login y obtener token
    const loginResult = await loginUserUseCase.execute({
      email: user.email,
      password: 'password123'
    });
    token = loginResult.token;

    // Crear chat de prueba
    const chat = await createChatUseCase.execute({
      name: 'Test Chat',
      participants: [userId],
      createdBy: userId
    });
    chatId = chat.id;

    // Conectar socket
    socket = io(`http://localhost:${port}`, {
      auth: { token },
      reconnection: false,
      forceNew: true
    });
  }, 30000);

  afterAll(async () => {
    socket.disconnect();
    httpServer.close();
    await mongoDBConnection.disconnect();
    await redisConnection.disconnect();
  });

  it('should connect with valid JWT', (done) => {
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      done();
    });
  });

  it('should join a chat room', (done) => {
    socket.emit('joinChat', chatId);
    // Verificar que el socket se unió a la room
    setTimeout(() => {
      done();
    }, 100);
  });

  it('should receive message event when a message is sent', (done) => {
    socket.on('message', (data) => {
      expect(data.chatId).toBe(chatId);
      expect(data.content).toBe('Hello, world!');
      done();
    });

    // Simular envío de mensaje
    sendMessageUseCase.execute({
      chatId,
      senderId: userId,
      content: 'Hello, world!'
    }).catch(done);
  });

  it('should receive typing event when a user is typing', (done) => {
    socket.on('typing', (data) => {
      expect(data.chatId).toBe(chatId);
      expect(data.userId).toBe(userId);
      done();
    });

    // Simular evento de typing
    notifyUserTypingUseCase.execute({
      chatId,
      userId
    }).catch(done);
  });
});