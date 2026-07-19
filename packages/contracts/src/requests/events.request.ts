import { z } from 'zod';
import { EVENT_STATUS } from '../enums';

/** Query params for GET /events. Shared so the API validates and the client builds the same shape. */
export const listEventsQuerySchema = z.object({
  status: z.enum(EVENT_STATUS).optional(),
  source: z.string().min(1).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
