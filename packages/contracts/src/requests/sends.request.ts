import { z } from 'zod';
import { SEND_STATUS } from '../enums';

/** Query params for GET /sends (DLQ view filters on status = 'dead_lettered'). */
export const listSendsQuerySchema = z.object({
  status: z.enum(SEND_STATUS).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListSendsQuery = z.infer<typeof listSendsQuerySchema>;
