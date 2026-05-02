import { Request, Response } from 'express';
import { ChatController } from './ChatController';
import { CreateChatUseCase } from '@application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from '@application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from '@application/use-cases/GetChatDetailsUseCase';
import { ValidationError } from '@domain/errors/DomainError';

describe('ChatController', () => {
  let controller: ChatController;
  let createChatUseCase: jest.Mocked<CreateChatUseCase>;
  let listChatsUseCase: jest.Mocked<ListChatsUseCase>;
  let getChatDetailsUseCase: jest.Mocked<GetChatDetailsUseCase>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createChatUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateChatUseCase>;

    listChatsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListChatsUseCase>;

    getChatDetailsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetChatDetailsUseCase>;

    controller = new ChatController(createChatUseCase, listChatsUseCase, getChatDetailsUseCase);

    req = {
      userId: '11111111-1111-1111-1111-111111111111',
      body: {
        recipientId: '22222222-2222-2222-2222-222222222222',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('create', () => {
    it('should forward recipientId to createChat use case', async () => {
      const chatResponse = {
        id: 'chat-id',
        participants: [
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
        ],
      };

      createChatUseCase.execute.mockResolvedValue(chatResponse as never);

      await controller.create(req as Request, res as Response);

      expect(createChatUseCase.execute).toHaveBeenCalledWith({
        userId: '11111111-1111-1111-1111-111111111111',
        recipientId: '22222222-2222-2222-2222-222222222222',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: chatResponse,
      });
    });

    it('should propagate validation error when creating self-recipient chat', async () => {
      const error = new ValidationError('Cannot create chat with yourself');
      createChatUseCase.execute.mockRejectedValue(error);

      req.body = {
        recipientId: '11111111-1111-1111-1111-111111111111',
      };

      await expect(controller.create(req as Request, res as Response)).rejects.toThrow(error);
      expect(createChatUseCase.execute).toHaveBeenCalledWith({
        userId: '11111111-1111-1111-1111-111111111111',
        recipientId: '11111111-1111-1111-1111-111111111111',
      });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
