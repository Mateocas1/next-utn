import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';
import { MessageDTO } from '../dtos/MessageDTO';
import { ChatRepository } from '../ports/ChatRepository';
import { MessageRepository } from '../ports/MessageRepository';
import { encodeCursor } from '../utils/cursor';

export interface GetMessageHistoryInput {
  chatId: string;
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface GetMessageHistoryOutput {
  data: MessageDTO[];
  meta: {
    nextCursor: string | null;
    limit: number;
  };
}

/**
 * GetMessageHistoryUseCase - Handles retrieving message history with cursor pagination.
 * 
 * Only chat participants may access message history.
 * Messages are returned sorted by createdAt descending (newest first).
 */
export class GetMessageHistoryUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository
  ) {}

  async execute(input: GetMessageHistoryInput): Promise<GetMessageHistoryOutput> {
    // Find chat
    const chat = await this.chatRepository.findById(input.chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.participants.includes(input.userId)) {
      throw new ChatAccessDeniedError();
    }

    const limit = input.limit || 20;
    
    // Get messages from repository
    const messages = await this.messageRepository.findByChatId(
      input.chatId,
      limit + 1, // Fetch one extra to determine if there's a next page
      input.cursor
    );

    // Determine if there's a next page
    const hasNextPage = messages.length > limit;
    const messagesPage = hasNextPage ? messages.slice(0, limit) : messages;

    // Calculate next cursor if there's a next page
    let nextCursor: string | null = null;
    if (hasNextPage && messagesPage.length > 0) {
      const lastMessage = messagesPage[messagesPage.length - 1];
      nextCursor = encodeCursor({
        lastId: lastMessage.id,
        lastSortValue: lastMessage.createdAt.getTime()
      });
    }

    const data = messagesPage.map((message) => ({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }));

    return {
      data,
      meta: {
        nextCursor,
        limit
      }
    };
  }
}
