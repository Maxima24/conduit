import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="p-6 text-sm text-[var(--color-muted)]">{label}</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return <div className="p-6 text-sm text-rose-300">Error: {message}</div>;
}

export function EmptyState({ children = 'Nothing here yet.' }: { children?: ReactNode }) {
  return (
    <div className="p-6 text-center text-sm text-[var(--color-muted)]">{children}</div>
  );
}
