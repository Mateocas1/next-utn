import { Request, Response } from 'express';
import { SendMessageUseCase } from '@application/use-cases/SendMessageUseCase';
import { GetMessageHistoryUseCase } from '@application/use-cases/GetMessageHistoryUseCase';
import { NotifyUserTypingUseCase } from '@application/use-cases/NotifyUserTypingUseCase';
import { successResponse } from '../utils/response';
import { z } from 'zod';

export class MessageController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessageHistoryUseCase: GetMessageHistoryUseCase,
    private readonly notifyUserTypingUseCase: NotifyUserTypingUseCase
  ) {}

  async notifyTyping(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      const { chatId, isTyping } = req.body;

      // Solo publicar evento si el usuario está escribiendo
      if (isTyping) {
        await this.notifyUserTypingUseCase.execute({
          chatId,
          userId,
        });
      }

      res.status(200).json(successResponse({ success: true }));
    } catch (error) {
      throw error;
    }
  }

  async send(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      const { chatId, content } = req.body;
      
      const message = await this.sendMessageUseCase.execute({
        chatId,
        senderId: userId,
        content,
      });

      res.status(201).json(successResponse(message));
    } catch (error) {
      throw error;
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!; // From auth middleware
      const { chatId, cursor, limit } = req.query;
      
      const result = await this.getMessageHistoryUseCase.execute({
        chatId: chatId as string,
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
}