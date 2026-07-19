import type { ReactNode } from 'react';

export function LegacyPageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100dvh-48px)] bg-[#080808] px-4 py-6 sm:min-h-[calc(100dvh-26px)] sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

