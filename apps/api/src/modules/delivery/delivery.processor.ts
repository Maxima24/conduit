import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import type { DeliveryJobData } from '../../queue/job.types';

/**
 * Consumes enqueued webhook events and delivers them.
 *
 * TODO(BE2 · P0 · Day 1): create Send rows with `causedBy` set, deliver via ResendProvider,
 * record each Attempt, retry with exponential backoff + jitter, and dead-letter after max
 * attempts. On each status change, publish a StreamService event so SSE clients refetch.
 */
@Processor(QUEUE_NAMES.delivery)
export class DeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(DeliveryProcessor.name);

  async process(job: Job<DeliveryJobData>): Promise<void> {
    this.logger.log(`(stub) received delivery job for event ${job.data.eventId}`);
    await Promise.resolve();
  }
}
