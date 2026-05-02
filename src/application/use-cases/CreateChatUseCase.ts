import { Chat } from '@domain/entities/Chat';
import { ChatRepository } from '../ports/ChatRepository';
import { ValidationError } from '@domain/errors/DomainError';

export interface CreateChatInput {
  userId: string;
  recipientId: string;
}

export interface CreateChatOutput {
  id: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CreateChatUseCase - Handles chat creation.
 * 
 * Creates a new chat with the authenticated user and selected recipient.
 */
export class CreateChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(input: CreateChatInput): Promise<CreateChatOutput> {
    if (input.userId === input.recipientId) {
      throw new ValidationError('Cannot create chat with yourself');
    }

    // Create chat entity
    const chat = Chat.create(input.userId, input.recipientId);

    // Save chat
    const savedChat = await this.chatRepository.create(chat);

    // Return output
    return {
      id: savedChat.id,
      participants: savedChat.participants,
      createdAt: savedChat.createdAt,
      updatedAt: savedChat.updatedAt
    };
  }
}
