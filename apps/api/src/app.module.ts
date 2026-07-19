import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './modules/health/health.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { EventsModule } from './modules/events/events.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { StreamModule } from './modules/stream/stream.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    // Infrastructure
    AppConfigModule,
    PrismaModule,
    QueueModule,
    // Feature modules (vertical slices)
    HealthModule,
    WebhooksModule, // BE1 — ingest
    EventsModule, // BE1 — read API
    DeliveryModule, // BE2 — sends, retry, DLQ, providers
    ReconciliationModule, // BE2 — invariant + gaps
    StreamModule, // BE2 — SSE
    StatsModule, // BE2 — dashboard counts
  ],
})
export class AppModule {}
