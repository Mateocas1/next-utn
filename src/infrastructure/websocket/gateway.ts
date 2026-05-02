import { Server as SocketIOServer, Socket } from 'socket.io';
import { EventBus } from '../../application/ports/EventBus';
import { MessageSentEvent } from '../../domain/events/MessageSentEvent';
import { UserTypingEvent } from '../../domain/events/UserTypingEvent';
import { NotificationSentEvent } from '../../domain/events/NotificationSentEvent';

/**
 * Gateway para manejar eventos de WebSocket.
 * Se suscribe al EventBus y emite eventos a rooms de Socket.IO.
 */
export class WebSocketGateway {
  constructor(private readonly io: SocketIOServer) {}

  /**
   * Suscribirse al EventBus para escuchar eventos.
   */
  subscribe(eventBus: EventBus): void {
    eventBus.subscribe(MessageSentEvent.name, this.handleMessageSent.bind(this));
    eventBus.subscribe(UserTypingEvent.name, this.handleUserTyping.bind(this));
    eventBus.subscribe(NotificationSentEvent.name, this.handleNotificationSent.bind(this));
  }

  /**
   * Manejar evento `MessageSentEvent`.
   * Emitir mensaje a la room del chat.
   */
  private async handleMessageSent(event: MessageSentEvent): Promise<void> {
    const roomId = `chat:${event.payload.chatId}`;
    this.io.to(roomId).emit('message', {
      id: event.payload.messageId,
      chatId: event.payload.chatId,
      senderId: event.payload.senderId,
      content: event.payload.content,
      createdAt: event.payload.createdAt,
    });
  }

  /**
   * Manejar evento `UserTypingEvent`.
   * Emitir evento "typing" a la room del chat.
   */
  private async handleUserTyping(event: UserTypingEvent): Promise<void> {
    const roomId = `chat:${event.payload.chatId}`;
    this.io.to(roomId).emit('typing', {
      userId: event.payload.userId,
      chatId: event.payload.chatId,
    });
  }

  /**
   * Manejar evento `NotificationSentEvent`.
   * Emitir notificación al usuario destinatario.
   */
  private async handleNotificationSent(event: NotificationSentEvent): Promise<void> {
    const userId = event.notification.userId;
    this.io.to(`user:${userId}`).emit('notification', {
      id: event.notification.id,
      title: event.notification.title,
      message: event.notification.message,
      read: event.notification.read,
      createdAt: event.notification.createdAt,
      metadata: event.notification.metadata,
    });
  }

  /**
   * Manejar conexión de un cliente.
   * Unir al usuario a rooms basadas en sus chats activos.
   */
  public handleConnection(socket: Socket): void {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Unir al usuario a su room personal
    socket.join(`user:${userId}`);

    // Escuchar evento para unirse a un chat
    socket.on('joinChat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${userId} joined chat: ${chatId}`);
    });

    // Escuchar evento para abandonar un chat
    socket.on('leaveChat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userId} left chat: ${chatId}`);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  }
}
