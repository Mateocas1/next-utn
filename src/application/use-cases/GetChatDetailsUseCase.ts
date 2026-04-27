import { Chat } from '@domain/entities/Chat';
import { NotFoundError, ChatAccessDeniedError } from '@domain/errors/DomainError';
import { ChatRepository } from '../ports/ChatRepository';

export interface GetChatDetailsInput {
  chatId: string;
  userId: string;
}

export interface GetChatDetailsOutput {
  id: string;
  participants: string[];
  latestMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GetChatDetailsUseCase - Handles retrieving chat details.
 * 
 * Only chat participants may access chat details.
 */
export class GetChatDetailsUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(input: GetChatDetailsInput): Promise<GetChatDetailsOutput> {
    // Find chat by ID
    const chat = await this.chatRepository.findById(input.chatId);
    if (!chat) {
      throw new NotFoundError('Chat');
    }

    // Check if user is participant
    if (!chat.participants.includes(input.userId)) {
      throw new ChatAccessDeniedError();
    }

    // Return chat details
    return {
      id: chat.id,
      participants: chat.participants,
      latestMessagePreview: chat.latestMessagePreview,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };
  }
}