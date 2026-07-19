'use client';

import type { SendDto } from '@conduit/contracts';
import { Badge } from '@/components/ui/badge';
import { Table, TCell, THead, TRow } from '@/components/ui/table';
import { useReplay } from '../hooks/use-replay';

export function DlqTable({ sends }: { sends: SendDto[] }) {
  const replay = useReplay();
  return (
    <Table>
      <THead columns={['To', 'Cause', 'Attempts', 'Age', '']} />
      <tbody>
        {sends.map((s) => (
          <TRow key={s.id}>
            <TCell>{s.to}</TCell>
            <TCell>
              <Badge tone="danger">{s.lastError ?? 'unknown'}</Badge>
            </TCell>
            <TCell className="tabular-nums">{s.attempts}</TCell>
            <TCell className="text-[var(--color-muted)]">
              {new Date(s.createdAt).toLocaleString()}
            </TCell>
            <TCell>
              <button
                type="button"
                onClick={() => replay.mutate(s.id)}
                disabled={replay.isPending}
                className="rounded-md bg-[var(--color-accent)]/15 px-3 py-1 text-xs text-[var(--color-accent)] disabled:opacity-50"
              >
                {replay.isPending ? 'Replaying…' : 'Replay'}
              </button>
            </TCell>
          </TRow>
        ))}
      </tbody>
    </Table>
  );
}
