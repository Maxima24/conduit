import { z } from 'zod';

/** Optional time window for GET /reconcile. */
export const reconcileQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ReconcileQuery = z.infer<typeof reconcileQuerySchema>;

export interface DateRange {
  from?: string;
  to?: string;
}
