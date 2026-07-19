import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left">
        {columns.map((c) => (
          <th key={c} className="px-4 py-2 font-medium text-[var(--color-muted)]">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-[var(--color-border)] last:border-0">{children}</tr>;
}

export function TCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2 align-middle ${className}`}>{children}</td>;
}
