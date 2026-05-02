import { Chat } from '@domain/entities/Chat';

/**
 * ChatRepository port interface.
 * 
 * Defines the contract for chat persistence operations.
 * Implementations are provided by the infrastructure layer.
 */
export interface ChatRepository {
  /**
   * Create a new chat.
   * @param chat The chat entity to persist
   * @returns The created chat with generated ID
   */
  create(chat: Chat): Promise<Chat>;
  
  /**
   * Find a chat by ID.
   * @param id The chat ID
   * @returns The chat if found, null otherwise
   */
  findById(id: string): Promise<Chat | null>;
  
  /**
   * Find chats for a user with cursor-based pagination.
   * @param userId The user ID
   * @param limit Maximum number of chats to return
   * @param cursor Optional cursor for pagination
   * @returns Array of chats ordered by updatedAt descending
   */
  findByUserId(userId: string, limit: number, cursor?: string): Promise<Chat[]>;
  
  /**
   * Update the latest message preview in a chat with optimistic locking.
   * @param chatId The chat ID
   * @param messagePreview The new latest message preview
   * @param version The expected current version (for optimistic locking)
   * @param session Optional MongoDB session for transactions
   * @returns The updated chat
   * @throws ConcurrentModificationError if version mismatch
   */
  updateLatestMessage(
    chatId: string, 
    messagePreview: string, 
    version: number,
    session?: any
  ): Promise<Chat>;

  removeParticipant(chatId: string, userId: string, session?: any): Promise<Chat>;

  delete(id: string, session?: any): Promise<void>;

  findByParticipantId(userId: string, session?: any): Promise<Chat[]>;
}
