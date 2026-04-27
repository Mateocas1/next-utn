import { Request, Response } from 'express';
import { CreateChatUseCase } from '@application/use-cases/CreateChatUseCase';
import { ListChatsUseCase } from '@application/use-cases/ListChatsUseCase';
import { GetChatDetailsUseCase } from '@application/use-cases/GetChatDetailsUseCase';
import { successResponse } from '../utils/response';

export class ChatController {
  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly listChatsUseCase: ListChatsUseCase,
    private readonly getChatDetailsUseCase: GetChatDetailsUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      
      const chat = await this.createChatUseCase.execute({
        userId,
      });

      res.status(201).json(successResponse(chat));
    } catch (error) {
      throw error;
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      const { cursor, limit } = req.query;
      
      const result = await this.listChatsUseCase.execute({
        userId,
        cursor: cursor as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json(successResponse(result.data, {
        nextCursor: result.meta.nextCursor,
        limit: result.meta.limit,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
      
      const chat = await this.getChatDetailsUseCase.execute({
        chatId,
        userId,
      });

      res.status(200).json(successResponse(chat));
    } catch (error) {
      throw error;
    }
  }
}