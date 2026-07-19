import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ListSendsQuery, Paginated, SendDto } from '@conduit/contracts';
import { normalizeLimit, toPage } from '../../common/pagination/cursor';
import { SendsRepository } from './sends.repository';
import { SendsMapper } from './sends.mapper';

@Injectable()
export class SendsService {
  constructor(private readonly repo: SendsRepository) {}

  async list(query: ListSendsQuery): Promise<Paginated<SendDto>> {
    const limit = normalizeLimit(query.limit);
    const { rows, total } = await this.repo.findMany({
      status: query.status,
      cursor: query.cursor,
      limit,
    });
    const page = toPage(rows, limit, total, (r) => r.id);
    return { ...page, items: page.items.map(SendsMapper.toDto) };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async replay(id: string): Promise<SendDto> {
    // TODO(BE2 · P0 · Day 2): re-enqueue a dead_lettered send. Must be idempotent so a
    // double-click can't double-send (guard on current status / a replay marker).
    throw new NotImplementedException('Send replay is not implemented yet (BE2, day 2).');
  }
}
