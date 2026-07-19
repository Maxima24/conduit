import type { Channel, SendDto, SendStatus, SendWithAttemptsDto } from '@conduit/contracts';
import type { SendRow, SendRowWithAttempts } from './sends.repository';
import { AttemptsMapper } from './attempts.mapper';

export const SendsMapper = {
  toDto(row: SendRow): SendDto {
    return {
      id: row.id,
      causedBy: row.causedBy,
      channel: row.channel as Channel,
      to: row.to,
      status: row.status as SendStatus,
      attempts: row.attempts,
      lastError: row.lastError ?? null,
      createdAt: row.createdAt.toISOString(),
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
    };
  },

  toWithAttemptsDto(row: SendRowWithAttempts): SendWithAttemptsDto {
    return {
      ...SendsMapper.toDto(row),
      attemptHistory: row.attemptHistory.map(AttemptsMapper.toDto),
    };
  },
};
