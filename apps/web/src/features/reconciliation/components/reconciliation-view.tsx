'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GAP_TYPE, type GapDto } from '@conduit/contracts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { reconcileQueryOptions } from '../api/get-reconcile';
import { HealthStrip } from './health-strip';

function GapItem({ gap }: { gap: GapDto }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-0">
      <div>
        <p className="text-sm">{gap.detail}</p>
        <p className="text-xs text-[var(--color-muted)]">
          {new Date(gap.detectedAt).toLocaleString()}
        </p>
      </div>
      {gap.eventId ? (
        <Link
          href={`/events/${gap.eventId}`}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          view event →
        </Link>
      ) : null}
    </div>
  );
}

export function ReconciliationView() {
  const { data, isLoading, isError, error } = useQuery(reconcileQueryOptions());

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Reconciliation</h1>
        <HealthStrip report={data} />
      </div>

      {data.gaps.length === 0 ? (
        <EmptyState>No open gaps — every processed event delivered. ✅</EmptyState>
      ) : (
        GAP_TYPE.map((type) => {
          const gaps = data.gaps.filter((g) => g.type === type);
          if (!gaps.length) return null;
          return (
            <Card key={type}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="warning">{type}</Badge>
                <span className="text-xs text-[var(--color-muted)]">{gaps.length}</span>
              </div>
              {gaps.map((g) => (
                <GapItem key={g.id} gap={g} />
              ))}
            </Card>
          );
        })
      )}
    </section>
  );
}
