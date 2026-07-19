import { Injectable, NotFoundException } from '@nestjs/common';
import type { EventDetailDto, EventDto, ListEventsQuery, Paginated } from '@conduit/contracts';
import { normalizeLimit, toPage } from '../../common/pagination/cursor';
import { EventsRepository } from './events.repository';
import { EventsMapper } from './events.mapper';

@Injectable()
export class EventsService {
  constructor(private readonly repo: EventsRepository) {}

  async list(query: ListEventsQuery): Promise<Paginated<EventDto>> {
    const limit = normalizeLimit(query.limit);
    const { rows, total } = await this.repo.findMany({
      status: query.status,
      source: query.source,
      cursor: query.cursor,
      limit,
      from: query.from,
      to: query.to,
    });
    const page = toPage(rows, limit, total, (r) => r.id);
    return { ...page, items: page.items.map(EventsMapper.toDto) };
  }

  async getById(id: string): Promise<EventDetailDto> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException(`Event ${id} not found`);
    return EventsMapper.toDetailDto(row);
  }
}
