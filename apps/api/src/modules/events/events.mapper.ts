import type { EventDetailDto, EventDto, EventStatus } from '@conduit/contracts';
import { SendsMapper } from '../delivery/sends.mapper';
import type { EventRow, EventRowDetailed } from './events.repository';

/** Pure Prisma-row → DTO conversion. This is where Date → ISO and undefined → null happen. */
export const EventsMapper = {
  toDto(row: EventRow): EventDto {
    return {
      id: row.id,
      source: row.source,
      type: row.type,
      idempotencyKey: row.idempotencyKey,
      status: row.status as EventStatus,
      payload: row.payload as Record<string, unknown>,
      receivedAt: row.receivedAt.toISOString(),
      processedAt: row.processedAt?.toISOString() ?? null,
    };
  },

  toDetailDto(row: EventRowDetailed): EventDetailDto {
    return {
      ...EventsMapper.toDto(row),
      sends: row.sends.map(SendsMapper.toWithAttemptsDto),
    };
  },
};
