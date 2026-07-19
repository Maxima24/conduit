import { describe, expect, it } from 'vitest';
import { EventsMapper } from './events.mapper';
import type { EventRow } from './events.repository';

describe('EventsMapper', () => {
  it('normalizes Date → ISO string and undefined → null', () => {
    const row = {
      id: 'evt_1',
      source: 'stripe',
      type: 'payment.succeeded',
      idempotencyKey: 'idem_1',
      status: 'processed',
      payload: { hello: 'world' },
      signature: null,
      receivedAt: new Date('2026-01-01T00:00:00.000Z'),
      processedAt: null,
    } satisfies Record<string, unknown> as unknown as EventRow;

    const dto = EventsMapper.toDto(row);

    expect(dto.receivedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.processedAt).toBeNull();
    expect(dto.status).toBe('processed');
    expect(dto.payload).toEqual({ hello: 'world' });
  });
});
