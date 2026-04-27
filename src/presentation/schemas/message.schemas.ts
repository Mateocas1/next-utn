import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID format'),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content cannot exceed 2000 characters'),
});

export const getMessageHistorySchema = z.object({
  chatId: z.string().uuid('Invalid chat ID format'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessageHistoryQuery = z.infer<typeof getMessageHistorySchema>;