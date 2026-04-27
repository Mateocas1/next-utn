import { z } from 'zod';

export const createChatSchema = z.object({
  // No body needed for creating a chat - user is inferred from auth
});

export const chatIdSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID format'),
});

export const listChatsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type ChatIdParams = z.infer<typeof chatIdSchema>;
export type ListChatsQuery = z.infer<typeof listChatsSchema>;