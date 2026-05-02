import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '@application/ports/ChatRepository';
import { ChatModel } from '../models/ChatModel';
import mongoose from 'mongoose';
import { ConcurrentModificationError, InvalidCursorError } from '@domain/errors/DomainError';
import { decodeCursor } from '@application/utils/cursor';

export class MongooseChatRepository implements ChatRepository {
  async create(chat: Chat): Promise<Chat> {
    const chatDoc = new ChatModel({
      id: chat.id,
      participants: chat.participants,
      latestMessagePreview: chat.latestMessagePreview,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      __v: chat.version,
    });

    await chatDoc.save();
    return chat;
  }

  async findById(id: string): Promise<Chat | null> {
    const chatDoc = await ChatModel.findOne({ id });
    if (!chatDoc) {
      return null;
    }

    return Chat.reconstruct({
      id: chatDoc.id,
      participants: chatDoc.participants,
      latestMessagePreview: chatDoc.latestMessagePreview || undefined,
      createdAt: chatDoc.createdAt,
      updatedAt: chatDoc.updatedAt,
      version: chatDoc.__v,
    });
  }

  async findByUserId(userId: string, limit: number, cursor?: string): Promise<Chat[]> {
    try {
      let query = ChatModel.find({ participants: userId });
      
      if (cursor) {
        try {
          const decoded = decodeCursor(cursor);
          const lastUpdatedAt = new Date(decoded.lastSortValue as number);
          const lastId = decoded.lastId as string;
          
          // Cursor pagination: get items after the cursor
          query = query.or([
            { updatedAt: { $lt: lastUpdatedAt } },
            { 
              updatedAt: lastUpdatedAt,
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
        .sort({ updatedAt: -1, id: -1 })
        .limit(limit);
      
      const chatDocs = await query.exec();
      
      return chatDocs.map(doc => Chat.reconstruct({
        id: doc.id,
        participants: doc.participants,
        latestMessagePreview: doc.latestMessagePreview || undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        version: doc.__v,
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

  async updateLatestMessage(
    chatId: string, 
    messagePreview: string, 
    version: number,
    session?: any
  ): Promise<Chat> {
    const query = ChatModel.findOneAndUpdate(
      { id: chatId, __v: version },
      { 
        $set: { 
          latestMessagePreview: messagePreview,
          updatedAt: new Date(),
        },
        $inc: { __v: 1 }
      },
      { 
        returnDocument: 'after',
        session,
        runValidators: true 
      }
    );

    const updatedDoc = await query.exec();
    
    if (!updatedDoc) {
      throw new ConcurrentModificationError();
    }

    return Chat.reconstruct({
      id: updatedDoc.id,
      participants: updatedDoc.participants,
      latestMessagePreview: updatedDoc.latestMessagePreview || undefined,
      createdAt: updatedDoc.createdAt,
      updatedAt: updatedDoc.updatedAt,
      version: updatedDoc.__v,
    });
  }

  async removeParticipant(chatId: string, userId: string, session?: any): Promise<Chat> {
    const updatedDoc = await ChatModel.findOneAndUpdate(
      { id: chatId },
      {
        $pull: { participants: userId },
        $set: { updatedAt: new Date() },
        $inc: { __v: 1 },
      },
      {
        returnDocument: 'after',
        session,
        runValidators: true,
      }
    ).exec();

    if (!updatedDoc) {
      throw new Error('Chat not found');
    }

    return Chat.reconstruct({
      id: updatedDoc.id,
      participants: updatedDoc.participants,
      latestMessagePreview: updatedDoc.latestMessagePreview || undefined,
      createdAt: updatedDoc.createdAt,
      updatedAt: updatedDoc.updatedAt,
      version: updatedDoc.__v,
    });
  }

  async delete(id: string, session?: any): Promise<void> {
    await ChatModel.deleteOne({ id }, { session });
  }

  async findByParticipantId(userId: string, session?: any): Promise<Chat[]> {
    const chatDocs = await ChatModel.find({ participants: userId }, null, { session }).exec();

    return chatDocs.map((chatDoc) =>
      Chat.reconstruct({
        id: chatDoc.id,
        participants: chatDoc.participants,
        latestMessagePreview: chatDoc.latestMessagePreview || undefined,
        createdAt: chatDoc.createdAt,
        updatedAt: chatDoc.updatedAt,
        version: chatDoc.__v,
      })
    );
  }
}
