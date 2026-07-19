import Link from 'next/link';
import type { EventDto } from '@conduit/contracts';
import { Table, TCell, THead, TRow } from '@/components/ui/table';
import { EventStatusBadge } from './event-status-badge';

export function EventsTable({ events }: { events: EventDto[] }) {
  return (
    <Table>
      <THead columns={['Source', 'Type', 'Status', 'Received']} />
      <tbody>
        {events.map((e) => (
          <TRow key={e.id}>
            <TCell>
              <Link
                href={`/events/${e.id}`}
                className="text-[var(--color-accent)] hover:underline"
              >
                {e.source}
              </Link>
            </TCell>
            <TCell className="font-mono text-xs">{e.type}</TCell>
            <TCell>
              <EventStatusBadge status={e.status} />
            </TCell>
            <TCell className="text-[var(--color-muted)]">
              {new Date(e.receivedAt).toLocaleString()}
            </TCell>
          </TRow>
        ))}
      </tbody>
    </Table>
  );
}
