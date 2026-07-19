'use client';

import { Check, Copy, TerminalSquare } from 'lucide-react';
import { useState } from 'react';
import { ALL_SCOPES, SCOPE_GROUPS, type AccessEntity } from './access-data';
import { ColumnLabel } from './scope-tree';

type LivePreviewProps = {
  entity: AccessEntity;
  grantedScopes: string[];
  lastChanged: string | null;
};

const NODE_POSITIONS = [
  { x: 52, y: 88 },
  { x: 118, y: 34 },
  { x: 196, y: 62 },
  { x: 176, y: 138 },
  { x: 88, y: 148 },
];

export function LivePreview({ entity, grantedScopes, lastChanged }: LivePreviewProps) {
  const [copied, setCopied] = useState(false);
  const hasNoAccess = grantedScopes.length === 0;

  const copySnippet = async () => {
    const source = `import { Conduit } from '@conduit/sdk'\n\nconst client = new Conduit({\n  apiKey: process.env.CONDUIT_API_KEY,\n  scopes: [\n${grantedScopes.map((scope) => `    '${scope}',`).join('\n')}\n  ]\n})`;
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside className="access-column min-w-0 bg-[#090909]">
      <ColumnLabel index="03" title="Live preview" detail={entity.label} />
      <div className="access-scroll flex-1 overflow-y-auto">
        {hasNoAccess ? (
          <div className="border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 font-mono text-[9px] leading-4 uppercase tracking-[0.12em] text-amber-200/70">
            This configuration grants no SDK access. All endpoints will return 403.
          </div>
        ) : null}

        <section className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Effective scopes</p>
            <span className="font-mono text-[10px] text-white/55">{String(grantedScopes.length).padStart(2, '0')}</span>
          </div>
          <div className="flex min-h-16 flex-wrap content-start gap-1.5">
            {grantedScopes.length ? (
              grantedScopes.map((scope) => (
                <span key={scope} className="scope-pill border border-white/12 bg-white/[0.035] px-2 py-1 font-mono text-[9px] text-white/58">
                  {scope}
                </span>
              ))
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/20">No reachable scopes</span>
            )}
          </div>
        </section>

        <section className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
              <TerminalSquare className="h-3.5 w-3.5" /> SDK initialization
            </p>
            <button type="button" onClick={copySnippet} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="overflow-x-auto border border-white/[0.08] bg-black/50 p-3 font-mono text-[10px] leading-[1.65]">
            <p><span className="text-violet-300/70">import</span> <span className="text-white/70">{'{ Conduit }'}</span> <span className="text-violet-300/70">from</span> <span className="text-emerald-300/65">&apos;@conduit/sdk&apos;</span></p>
            <p>&nbsp;</p>
            <p><span className="text-violet-300/70">const</span> <span className="text-white/75">client</span> <span className="text-white/30">=</span> <span className="text-violet-300/70">new</span> <span className="text-white/75">Conduit</span><span className="text-white/35">({'{'}</span></p>
            <p className="pl-3 text-white/48">apiKey: process.env.<span className="text-amber-200/60">CONDUIT_API_KEY</span>,</p>
            <p className="pl-3 text-white/48">scopes: [</p>
            <div className="pl-6">
              {ALL_SCOPES.map((scope) => {
                const granted = grantedScopes.includes(scope.id);
                return (
                  <p key={`${entity.id}-${scope.id}`} className={`code-scope-line ${lastChanged === scope.id ? 'is-changing' : ''} ${granted ? 'text-emerald-200/65' : 'text-white/18'}`}>
                    {granted ? `'${scope.id}',` : `// '${scope.id}' - denied`}
                  </p>
                );
              })}
            </div>
            <p className="pl-3 text-white/48">]</p>
            <p className="text-white/35">{'})'}</p>
          </div>
        </section>

        <section className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Blast radius</p>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/20">
              <span className="h-1.5 w-1.5 bg-emerald-400" /> Reachable
            </span>
          </div>
          <BlastRadius grantedScopes={grantedScopes} />
        </section>
      </div>
    </aside>
  );
}

function BlastRadius({ grantedScopes }: { grantedScopes: string[] }) {
  const groupStates = SCOPE_GROUPS.map((group) => {
    const count = group.scopes.filter((scope) => grantedScopes.includes(scope.id)).length;
    return { label: group.label, count, total: group.scopes.length, active: count > 0, complete: count === group.scopes.length };
  });

  return (
    <div className="relative overflow-hidden border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_62%)]">
      <svg viewBox="0 0 248 180" className="h-auto w-full" role="img" aria-label="Effective SDK capability blast radius">
        <g className="text-white/10" stroke="currentColor" strokeWidth="1">
          {NODE_POSITIONS.map((position, index) => {
            const next = NODE_POSITIONS[(index + 1) % NODE_POSITIONS.length];
            const active = groupStates[index].active && groupStates[(index + 1) % groupStates.length].active;
            return <line key={groupStates[index].label} x1={position.x} y1={position.y} x2={next.x} y2={next.y} className={active ? 'blast-line is-active' : 'blast-line'} />;
          })}
          {NODE_POSITIONS.map((position, index) => (
            <line key={`center-${groupStates[index].label}`} x1="124" y1="91" x2={position.x} y2={position.y} className={groupStates[index].active ? 'blast-line is-active' : 'blast-line'} />
          ))}
        </g>

        <circle cx="124" cy="91" r="18" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.16)" />
        <circle cx="124" cy="91" r="4" fill={grantedScopes.length ? '#f5f5f5' : 'rgba(255,255,255,.18)'} />
        <text x="124" y="119" textAnchor="middle" className="fill-white/35 font-mono text-[7px] uppercase tracking-[0.18em]">SDK</text>

        {NODE_POSITIONS.map((position, index) => {
          const state = groupStates[index];
          return (
            <g key={state.label} className={state.active ? 'blast-node is-active' : 'blast-node'}>
              <circle cx={position.x} cy={position.y} r="15" fill={state.complete ? 'rgba(52,211,153,.13)' : 'rgba(255,255,255,.025)'} stroke={state.active ? 'rgba(52,211,153,.65)' : 'rgba(255,255,255,.13)'} />
              <circle cx={position.x} cy={position.y} r="3" fill={state.active ? '#6ee7b7' : 'rgba(255,255,255,.15)'} />
              <text x={position.x} y={position.y + 25} textAnchor="middle" className={state.active ? 'fill-white/65 font-mono text-[6px] uppercase' : 'fill-white/20 font-mono text-[6px] uppercase'}>{state.label}</text>
              <text x={position.x} y={position.y - 21} textAnchor="middle" className="fill-white/25 font-mono text-[6px]">{state.count}/{state.total}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
