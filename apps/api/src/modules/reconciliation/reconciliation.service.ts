import { Injectable } from '@nestjs/common';
import {
  GAP_TYPE,
  type GapType,
  type ReconcileQuery,
  type ReconcileReportDto,
} from '@conduit/contracts';
import { ReconciliationRepository } from './reconciliation.repository';
import { GapsMapper } from './reconciliation.mapper';

@Injectable()
export class ReconciliationService {
  constructor(private readonly repo: ReconciliationRepository) {}

  async getReport(query: ReconcileQuery): Promise<ReconcileReportDto> {
    const rows = await this.repo.findGaps(query);
    const gaps = rows.map(GapsMapper.toDto);

    const summary = GAP_TYPE.reduce(
      (acc, type) => ({ ...acc, [type]: gaps.filter((g) => g.type === type).length }),
      {} as Record<GapType, number>,
    );

    return {
      gaps,
      summary: { ...summary, total: gaps.length },
      lastRunAt: new Date().toISOString(),
      invariantHolds: gaps.every((g) => g.resolvedAt !== null),
    };
  }

  runReconciler(): void {
    // TODO(BE2 · P0 · Day 2): scheduled (~30s). Check the invariant — every `processed`
    // event has ≥1 send in a terminal state — and emit gaps for no_send / orphan_send /
    // duplicate_send / stuck. Publish a StreamService 'gap.detected' on each new gap.
  }
}
