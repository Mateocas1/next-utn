import { Message } from '@domain/entities/Message';

/**
 * MessageRepository port interface.
 * 
 * Defines the contract for message persistence operations.
 * Implementations are provided by the infrastructure layer.
 */
export interface MessageRepository {
  /**
   * Create a new message.
   * @param message The message entity to persist
   * @param session Optional MongoDB session for transactions
   * @returns The created message with generated ID
   */
  create(message: Message, session?: any): Promise<Message>;
  
  /**
   * Find messages for a chat with cursor-based pagination.
   * @param chatId The chat ID
   * @param limit Maximum number of messages to return
   * @param cursor Optional cursor for pagination
   * @returns Array of messages ordered by createdAt descending (newest first)
   */
  findByChatId(chatId: string, limit: number, cursor?: string): Promise<Message[]>;

  deleteByUserId(userId: string, session?: any): Promise<void>;

  deleteByChatId(chatId: string, session?: any): Promise<void>;

  findLatestByChatId(chatId: string, session?: any): Promise<Message | null>;
}
