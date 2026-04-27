import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const idempotencyKeySchema = z.object({
  'idempotency-key': z.string().min(1, 'Idempotency key is required').optional(),
}).catchall(z.any());

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdempotencyKeyHeader = z.infer<typeof idempotencyKeySchema>;