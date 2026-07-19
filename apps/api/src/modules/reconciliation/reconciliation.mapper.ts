import type { GapDto, GapType } from '@conduit/contracts';
import type { GapRow } from './reconciliation.repository';

export const GapsMapper = {
  toDto(row: GapRow): GapDto {
    return {
      id: row.id,
      type: row.type as GapType,
      eventId: row.eventId ?? null,
      sendId: row.sendId ?? null,
      detail: row.detail,
      detectedAt: row.detectedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    };
  },
};
