import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfigService } from '../../config/config.service';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * The single Prisma entry point. Injected ONLY into `*.repository.ts` files —
 * see the layering non-negotiable in the architecture doc.
 *
 * Prisma 7 connects through a driver adapter (@prisma/adapter-pg over `pg`) rather than
 * a schema `url`. The connection string comes from validated config.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
