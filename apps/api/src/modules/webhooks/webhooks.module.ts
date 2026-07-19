import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksRepository } from './webhooks.repository';
import { QUEUE_NAMES } from '../../queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.delivery })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksRepository],
})
export class WebhooksModule {}
