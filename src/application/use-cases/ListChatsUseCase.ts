import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '../ports/ChatRepository';
import { encodeCursor } from '../utils/cursor';

export interface ListChatsInput {
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface ChatListItem {
  id: string;
  participants: string[];
  latestMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListChatsOutput {
  data: ChatListItem[];
  meta: {
    nextCursor: string | null;
    limit: number;
  };
}

/**
 * ListChatsUseCase - Handles listing user chats with cursor pagination.
 * 
 * Returns chats sorted by updatedAt descending.
 */
export class ListChatsUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(input: ListChatsInput): Promise<ListChatsOutput> {
    try {
      const limit = input.limit || 20;
      
      // Get chats from repository
      const chats = await this.chatRepository.findByUserId(
        input.userId,
        limit + 1, // Fetch one extra to determine if there's a next page
        input.cursor
      );

      // Determine if there's a next page
      const hasNextPage = chats.length > limit;
      const data = hasNextPage ? chats.slice(0, limit) : chats;

      // Calculate next cursor if there's a next page
      let nextCursor: string | null = null;
      if (hasNextPage && data.length > 0) {
        const lastChat = data[data.length - 1];
        nextCursor = encodeCursor({
          lastId: lastChat.id,
          lastSortValue: lastChat.updatedAt.getTime()
        });
      }

      return {
        data: data.map(chat => ({
          id: chat.id,
          participants: chat.participants,
          latestMessagePreview: chat.latestMessagePreview,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        })),
        meta: {
          nextCursor,
          limit
        }
      };
    } catch (error) {
      throw error;
    }
  }
}