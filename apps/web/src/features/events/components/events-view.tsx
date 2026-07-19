'use client';

import { useQuery } from '@tanstack/react-query';
import { useFiltersStore } from '@/stores/filters.store';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { eventsQueryOptions } from '../api/get-events';
import { EventsTable } from './events-table';

export function EventsView() {
  const filters = useFiltersStore((s) => s.events);
  const { data, isLoading, isError, error } = useQuery(eventsQueryOptions(filters));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Events</h1>
        {data ? (
          <span className="text-sm text-[var(--color-muted)]">{data.total} total</span>
        ) : null}
      </div>

      {isLoading ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} /> : null}
      {data ? (
        data.items.length ? (
          <EventsTable events={data.items} />
        ) : (
          <EmptyState>No events yet.</EmptyState>
        )
      ) : null}
    </section>
  );
}
