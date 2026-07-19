import { Injectable } from '@nestjs/common';
import type { StatsDto } from '@conduit/contracts';
import { StatsRepository } from './stats.repository';

@Injectable()
export class StatsService {
  constructor(private readonly repo: StatsRepository) {}

  async get(): Promise<StatsDto> {
    const c = await this.repo.counts();
    return {
      eventsReceived: c.eventsReceived,
      eventsProcessed: c.eventsProcessed,
      // TODO(BE1/BE2): track rejected duplicates via a counter/metric — they aren't persisted.
      duplicatesRejected: 0,
      sendsDelivered: c.sendsDelivered,
      sendsInDlq: c.sendsInDlq,
      openGaps: c.openGaps,
    };
  }
}
