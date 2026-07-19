import type { AttemptDto } from '@conduit/contracts';

export function DeliveryTimeline({ attempts }: { attempts: AttemptDto[] }) {
  if (!attempts.length) {
    return <p className="text-sm text-[var(--color-muted)]">No attempts yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {attempts.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono text-xs text-[var(--color-muted)]">#{a.attemptNo}</span>
          <span className={a.error ? 'text-rose-300' : 'text-emerald-300'}>
            {a.statusCode ?? '—'} {a.error ? `· ${a.error}` : '· ok'}
          </span>
          <span className="text-[var(--color-muted)]">{a.durationMs}ms</span>
          {a.nextRetryAt ? (
            <span className="text-amber-300">
              backoff → {new Date(a.nextRetryAt).toLocaleTimeString()}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
