import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Prisma, ReconcileGap } from '../../generated/prisma/client';

export type GapRow = ReconcileGap;

@Injectable()
export class ReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGaps(range: { from?: string; to?: string }): Promise<GapRow[]> {
    const { from, to } = range;
    const where: Prisma.ReconcileGapWhereInput = {
      ...(from || to
        ? {
            detectedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };
    return this.prisma.reconcileGap.findMany({ where, orderBy: { detectedAt: 'desc' } });
  }

  countOpenGaps(): Promise<number> {
    return this.prisma.reconcileGap.count({ where: { resolvedAt: null } });
  }
}
