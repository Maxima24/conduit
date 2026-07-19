import type { Channel, SendStatus } from '../enums';
import type { AttemptDto } from './attempt.dto';

export interface SendDto {
  id: string;
  /** → EventDto.id */
  causedBy: string;
  channel: Channel;
  to: string;
  status: SendStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export interface SendWithAttemptsDto extends SendDto {
  attemptHistory: AttemptDto[];
}
