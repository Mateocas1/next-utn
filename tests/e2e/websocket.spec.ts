import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Configuración
const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Reemplazar con un token válido

// Helper para generar tokens JWT de prueba
const generateTestToken = (userId: string) => {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ userId })).toString('base64')}.signature`;
};

test.describe('WebSocket E2E Tests', () => {
  let socket: Socket;
  let chatId: string;
  let userId: string;

  test.beforeAll(async () => {
    // Crear un chat de prueba
    const response = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        participantIds: [uuidv4(), uuidv4()],
      }),
    });
    const data = await response.json();
    chatId = data.data.id;
    userId = data.data.participants[0];
  });

  test.beforeEach(async () => {
    // Conectar WebSocket
    socket = io(BASE_URL, {
      auth: {
        token: generateTestToken(userId),
      },
    });

    // Esperar a que la conexión esté lista
    await new Promise((resolve) => {
      socket.on('connect', resolve);
    });
  });

  test.afterEach(async () => {
    // Desconectar WebSocket
    socket.disconnect();
  });

  test('should connect with JWT', async () => {
    expect(socket.connected).toBeTruthy();
  });

  test('should receive message in real-time', async () => {
    // Unirse a la room del chat
    socket.emit('join', { chatId });

    // Enviar mensaje via REST
    const messageContent = 'Hola, esto es una prueba';
    const response = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        chatId,
        content: messageContent,
      }),
    });
    const data = await response.json();
    const messageId = data.data.id;

    // Esperar mensaje via WebSocket
    const messageReceived = new Promise((resolve) => {
      socket.on('message', (msg) => {
        resolve(msg);
      });
    });

    const receivedMessage = await messageReceived;
    expect(receivedMessage).toMatchObject({
      id: messageId,
      chatId,
      content: messageContent,
    });
  });

  test('should receive typing event', async () => {
    // Unirse a la room del chat
    socket.emit('join', { chatId });

    // Notificar "usuario escribiendo..." via REST
    await fetch(`${BASE_URL}/api/messages/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        chatId,
        isTyping: true,
      }),
    });

    // Esperar evento "typing" via WebSocket
    const typingEvent = new Promise((resolve) => {
      socket.on('typing', (data) => {
        resolve(data);
      });
    });

    const receivedTyping = await typingEvent;
    expect(receivedTyping).toMatchObject({
      userId,
      chatId,
    });
  });

  test('should receive notification in real-time', async () => {
    // Unirse a la room del usuario
    socket.emit('join', { userId });

    // Enviar mensaje via REST (simular que otro usuario envía un mensaje)
    const messageContent = 'Hola, esto es una notificación';
    await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        chatId,
        content: messageContent,
      }),
    });

    // Esperar notificación via WebSocket
    const notificationReceived = new Promise((resolve) => {
      socket.on('notification', (notification) => {
        resolve(notification);
      });
    });

    const receivedNotification = await notificationReceived;
    expect(receivedNotification).toMatchObject({
      type: 'NEW_MESSAGE',
      chatId,
      messagePreview: messageContent,
    });
  });
});