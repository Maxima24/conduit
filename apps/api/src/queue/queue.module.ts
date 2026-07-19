import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../config/config.service';

/** Global BullMQ connection. Individual modules `registerQueue` the queues they use. */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const url = new URL(config.redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: url.port ? Number(url.port) : 6379,
            ...(url.password ? { password: url.password } : {}),
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
