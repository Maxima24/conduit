import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DeliveryController } from './delivery.controller';
import { SendsService } from './sends.service';
import { SendsRepository } from './sends.repository';
import { DeliveryProcessor } from './delivery.processor';
import { ResendProvider } from './email/resend.provider';
import { QUEUE_NAMES } from '../../queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.delivery })],
  controllers: [DeliveryController],
  providers: [SendsService, SendsRepository, DeliveryProcessor, ResendProvider],
  exports: [SendsService, SendsRepository],
})
export class DeliveryModule {}
