'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { eventQueryOptions } from '../api/get-event';
import { DeliveryTimeline } from './delivery-timeline';
import { EventStatusBadge } from './event-status-badge';

export function EventDetailView({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery(eventQueryOptions(id));

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <section className="space-y-4">
      <Link href="/events" className="text-sm text-[var(--color-accent)] hover:underline">
        ← Events
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">
          {data.source} · {data.type}
        </h1>
        <EventStatusBadge status={data.status} />
      </div>

      <Card>
        <p className="mb-2 text-sm text-[var(--color-muted)]">Payload</p>
        <pre className="overflow-x-auto text-xs">{JSON.stringify(data.payload, null, 2)}</pre>
      </Card>

      {data.sends.map((s) => (
        <Card key={s.id}>
          <p className="mb-2 text-sm text-[var(--color-muted)]">
            Send → {s.to} ({s.channel}) · {s.status}
          </p>
          <DeliveryTimeline attempts={s.attemptHistory} />
        </Card>
      ))}
    </section>
  );
}
