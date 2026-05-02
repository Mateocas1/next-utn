import { z } from 'zod';

export const deleteUserParamsSchema = z.object({
  id: z.string().uuid('Invalid user id format'),
});

export const listUsersQuerySchema = z.object({}).strict();

export type DeleteUserParams = z.infer<typeof deleteUserParamsSchema>;
