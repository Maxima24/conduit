'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { replaySend } from '../api/replay-send';

/** Replay a dead-lettered send. Invalidates sends + stats on success. */
export function useReplay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => replaySend(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sends.all });
      void qc.invalidateQueries({ queryKey: queryKeys.stats.current() });
    },
  });
}
