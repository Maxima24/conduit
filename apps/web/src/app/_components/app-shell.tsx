'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ArchiveRestore, Braces, KeyRound, RadioTower, ScanSearch, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/events', label: 'Events', icon: RadioTower },
  { href: '/dlq', label: 'Dead letter', icon: ArchiveRestore },
  { href: '/reconciliation', label: 'Reconcile', icon: ScanSearch },
  { href: '/sdk/scopes', label: 'Scopes', icon: ShieldCheck },
  { href: '/sdk/keys', label: 'API keys', icon: KeyRound },
];

function ConduitMark() {
  return (
    <span className="relative grid h-10 w-10 place-items-center overflow-hidden border border-white/15 bg-white text-black">
      <Braces className="h-5 w-5" strokeWidth={2.4} />
      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 bg-emerald-500" />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[#050505] p-0 text-white sm:p-3">
      <div className="relative mx-auto flex min-h-dvh max-w-[1920px] overflow-hidden border-white/10 bg-[#080808] sm:min-h-[calc(100dvh-24px)] sm:border">
        <aside className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-white/10 bg-[#0b0b0b]/95 px-2 backdrop-blur-xl sm:static sm:h-auto sm:w-[70px] sm:shrink-0 sm:flex-col sm:border-r sm:border-t-0 sm:px-0">
          <Link href="/sdk/scopes" aria-label="Conduit access surface" className="hidden h-[72px] w-full place-items-center border-b border-white/10 sm:grid">
            <ConduitMark />
          </Link>

          <nav className="flex w-full flex-1 items-center justify-around sm:flex-col sm:justify-center sm:gap-2 sm:px-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`group/nav relative grid h-11 w-11 place-items-center border text-white/40 transition duration-200 hover:border-white/20 hover:bg-white/[0.04] hover:text-white sm:h-12 sm:w-full ${active ? 'border-white/20 bg-white/[0.07] text-white' : 'border-transparent'}`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {active ? <span className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-emerald-400 sm:left-[-9px]" /> : null}
                  <span className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap border border-white/10 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70 opacity-0 transition group-hover/nav:opacity-100 sm:bottom-auto sm:left-full sm:ml-3 sm:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden w-full border-t border-white/10 p-3 sm:block">
            <div className="mx-auto grid h-9 w-9 place-items-center border border-white/15 bg-white/[0.04] font-mono text-[10px] text-white/60">CD</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-x-hidden pb-16 sm:pb-0">
          <div className="flex h-12 items-center justify-between border-b border-white/10 px-4 sm:hidden">
            <div className="flex items-center gap-3">
              <ConduitMark />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">Conduit</span>
            </div>
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              <Activity className="h-3.5 w-3.5 text-emerald-400" /> Operational
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
