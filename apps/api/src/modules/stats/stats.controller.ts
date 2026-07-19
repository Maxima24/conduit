import { Controller, Get } from '@nestjs/common';
import type { StatsDto } from '@conduit/contracts';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  get(): Promise<StatsDto> {
    return this.stats.get();
  }
}
