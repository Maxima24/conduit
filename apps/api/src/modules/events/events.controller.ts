import { Controller, Get, Param, Query } from '@nestjs/common';
import type { EventDetailDto, EventDto, Paginated } from '@conduit/contracts';
import { EventsService } from './events.service';
import { ListEventsQueryDto } from './dto/list-events.query';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() query: ListEventsQueryDto): Promise<Paginated<EventDto>> {
    return this.events.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<EventDetailDto> {
    return this.events.getById(id);
  }
}
