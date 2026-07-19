import type { EventStatus } from '../enums';
import type { SendWithAttemptsDto } from './send.dto';

export interface EventDto {
  id: string;
  source: string;
  type: string;
  idempotencyKey: string;
  status: EventStatus;
  payload: Record<string, unknown>;
  /** ISO 8601, always UTC. */
  receivedAt: string;
  processedAt: string | null;
}

/** Returned by GET /events/:id — event with its full delivery history. */
export interface EventDetailDto extends EventDto {
  sends: SendWithAttemptsDto[];
}
