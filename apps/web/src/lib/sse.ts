'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, type StreamEvent } from '@conduit/contracts';
import { queryKeys } from './query-keys';
import { isMockMode } from '@/mocks';
import { useStreamStore } from '@/stores/stream.store';

/**
 * Bridges the SSE stream to TanStack Query invalidation. Each `kind` maps to a refetch.
 * Fallback: if SSE proves flaky, drop this hook and set `refetchInterval: 3000` on lists.
 */
export function useConduitStream(): void {
  const qc = useQueryClient();
  const setStatus = useStreamStore((s) => s.setStatus);

  useEffect(() => {
    // No live stream in mock mode.
    if (isMockMode()) {
      setStatus('disabled');
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL ?? ''}${API_ROUTES.stream.sse}`;
    const es = new EventSource(url);

    es.onopen = () => setStatus('connected');
    es.onerror = () => setStatus('reconnecting'); // EventSource auto-retries
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data) as StreamEvent;
      switch (ev.kind) {
        case 'event.created':
        case 'event.updated':
          void qc.invalidateQueries({ queryKey: queryKeys.events.all });
          break;
        case 'send.updated':
          void qc.invalidateQueries({ queryKey: queryKeys.sends.all });
          void qc.invalidateQueries({ queryKey: queryKeys.events.detail(ev.causedBy) });
          break;
        case 'gap.detected':
          void qc.invalidateQueries({ queryKey: ['reconcile'] });
          break;
        case 'heartbeat':
          break;
      }
      void qc.invalidateQueries({ queryKey: queryKeys.stats.current() });
    };

    return () => es.close();
  }, [qc, setStatus]);
}
