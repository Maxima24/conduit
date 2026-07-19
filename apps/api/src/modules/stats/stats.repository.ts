import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async counts(): Promise<{
    eventsReceived: number;
    eventsProcessed: number;
    sendsDelivered: number;
    sendsInDlq: number;
    openGaps: number;
  }> {
    const [eventsReceived, eventsProcessed, sendsDelivered, sendsInDlq, openGaps] =
      await this.prisma.$transaction([
        this.prisma.webhookEvent.count(),
        this.prisma.webhookEvent.count({ where: { status: 'processed' } }),
        this.prisma.send.count({ where: { status: 'sent' } }),
        this.prisma.send.count({ where: { status: 'dead_lettered' } }),
        this.prisma.reconcileGap.count({ where: { resolvedAt: null } }),
      ]);

    return { eventsReceived, eventsProcessed, sendsDelivered, sendsInDlq, openGaps };
  }
}
