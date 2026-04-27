import { Message } from '@domain/entities/Message';
import { MessageRepository } from '@application/ports/MessageRepository';
import { MessageModel } from '../models/MessageModel';
import { decodeCursor } from '@application/utils/cursor';
import { InvalidCursorError } from '@domain/errors/DomainError';

export class MongooseMessageRepository implements MessageRepository {
  async create(message: Message, session?: any): Promise<Message> {
    const messageDoc = new MessageModel({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    });

    await messageDoc.save({ session });
    return message;
  }

  async findByChatId(chatId: string, limit: number, cursor?: string): Promise<Message[]> {
    try {
      let query = MessageModel.find({ chatId });
      
      if (cursor) {
        try {
          const decoded = decodeCursor(cursor);
          const lastCreatedAt = new Date(decoded.lastSortValue as number);
          const lastId = decoded.lastId as string;
          
          // Cursor pagination: get items after the cursor
          query = query.or([
            { createdAt: { $lt: lastCreatedAt } },
            { 
              createdAt: lastCreatedAt,
              id: { $lt: lastId }
            }
          ]);
        } catch (error) {
          // Invalid cursor - rethrow InvalidCursorError
          if (error instanceof InvalidCursorError) {
            throw error;
          }
          // Other errors - treat as invalid cursor
          throw new InvalidCursorError();
        }
      }
      
      query = query
        .sort({ createdAt: -1, id: -1 })
        .limit(limit);
      
      const messageDocs = await query.exec();
      
      return messageDocs.map(doc => Message.reconstruct({
        id: doc.id,
        chatId: doc.chatId,
        senderId: doc.senderId,
        content: doc.content,
        createdAt: doc.createdAt,
      }));
    } catch (error) {
      // Invalid cursor - rethrow InvalidCursorError
      if (error instanceof InvalidCursorError) {
        throw error;
      }
      // Other errors - rethrow
      throw error;
    }
  }
}