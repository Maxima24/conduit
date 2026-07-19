'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, KeyRound, Plus, ShieldCheck, X } from 'lucide-react';
import { ALL_SCOPES, INITIAL_GRANTS } from './access-data';

type KeyRecord = {
  id: string;
  label: string;
  created: string;
  lastUsed: string;
  team: string;
  status: 'Active' | 'Revoked';
  scopes: string[];
};

const INITIAL_KEYS: KeyRecord[] = [
  { id: 'KEY-001', label: 'Production ingest', created: 'Jul 02, 2026', lastUsed: '18s ago', team: 'Team Alpha', status: 'Active', scopes: INITIAL_GRANTS['key-001'] },
  { id: 'KEY-002', label: 'Delivery observer', created: 'Jun 18, 2026', lastUsed: '11m ago', team: 'Team Beta', status: 'Active', scopes: INITIAL_GRANTS['key-002'] },
  { id: 'KEY-003', label: 'Legacy worker', created: 'May 29, 2026', lastUsed: '14d ago', team: 'Team Alpha', status: 'Revoked', scopes: INITIAL_GRANTS['key-003'] },
];

type ScopePreset = 'full' | 'read' | 'custom';

export function KeyManager() {
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [expanded, setExpanded] = useState<string[]>(['KEY-001']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [team, setTeam] = useState('Team Alpha');
  const [preset, setPreset] = useState<ScopePreset>('read');
  const [customScopes, setCustomScopes] = useState<string[]>(['events:read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedScopes = preset === 'full'
    ? ALL_SCOPES.map((scope) => scope.id)
    : preset === 'read'
      ? ALL_SCOPES.filter((scope) => scope.id.endsWith(':read') || scope.id === 'events:filter').map((scope) => scope.id)
      : customScopes;

  const closeDrawer = () => {
    setDrawerOpen(false);
    setGeneratedKey(null);
    setCopied(false);
    setLabel('');
  };

  const generateKey = () => {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const secret = `cnd_live_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    const id = `KEY-${String(keys.length + 1).padStart(3, '0')}`;
    setKeys((current) => [
      ...current,
      { id, label: label.trim() || 'Untitled key', created: 'Just now', lastUsed: 'Never', team, status: 'Active', scopes: selectedScopes },
    ]);
    setGeneratedKey(secret);
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
  };

  const toggleCustomScope = (scopeId: string) => {
    setCustomScopes((current) => current.includes(scopeId) ? current.filter((id) => id !== scopeId) : [...current, scopeId]);
  };

  return (
    <main className="min-h-[calc(100dvh-48px)] sm:min-h-[calc(100dvh-26px)]">
      <header className="border-b border-white/10">
        <div className="flex min-h-[72px] flex-wrap items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
              <span>Credential vault</span><span className="text-white/12">/</span><span>API keys</span>
            </div>
            <p className="mt-1.5 text-xs text-white/35">Issue narrowly scoped credentials. Reveal secrets once.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/sdk/scopes" className="hidden items-center gap-2 border border-white/12 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition hover:border-white/35 hover:text-white sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Scope matrix
            </Link>
            <button type="button" onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 border border-white bg-white px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-emerald-300">
              <Plus className="h-3.5 w-3.5" /> Generate key
            </button>
          </div>
        </div>

        <div className="access-scroll flex h-9 items-center gap-4 overflow-x-auto border-t border-white/[0.06] bg-white/[0.018] px-4 font-mono text-[9px] uppercase tracking-[0.16em] text-white/28 sm:px-5 lg:px-6">
          <span className="border-r border-white/10 pr-4">Total keys <strong className="ml-2 font-medium text-white/65">{keys.length}</strong></span>
          <span className="border-r border-white/10 pr-4">Active <strong className="ml-2 font-medium text-emerald-300/75">{keys.filter((key) => key.status === 'Active').length}</strong></span>
          <span>Rotation policy <strong className="ml-2 font-medium text-white/65">90 days</strong></span>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:py-10">
        <section className="vault-panel overflow-hidden bg-[#0a0a0a]">
          <div className="grid grid-cols-[1fr_auto] items-center border-b border-white/10 px-4 py-4 sm:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto] sm:px-5">
            <div><p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Key registry</p><h1 className="mt-2 text-xl font-semibold sm:text-2xl">Production credentials</h1></div>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/25 sm:block">Created</div>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/25 sm:block">Last used</div>
            <div className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/25 sm:block">Team</div>
            <span className="font-mono text-[9px] text-white/20">{String(keys.length).padStart(2, '0')}</span>
          </div>

          {keys.map((key) => {
            const isExpanded = expanded.includes(key.id);
            return (
              <article key={key.id} className="border-b border-white/[0.07] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded((current) => current.includes(key.id) ? current.filter((id) => id !== key.id) : [...current, key.id])}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025] sm:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto] sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center border ${key.status === 'Active' ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300' : 'border-white/10 bg-white/[0.025] text-white/20'}`}><KeyRound className="h-4 w-4" /></span>
                    <div className="min-w-0"><p className="truncate font-mono text-[11px] text-white/75">{key.id} <span className="text-white/20">/</span> {key.label}</p><p className={`mt-1 font-mono text-[8px] uppercase tracking-[0.18em] ${key.status === 'Active' ? 'text-emerald-300/60' : 'text-red-300/50'}`}>{key.status}</p></div>
                  </div>
                  <span className="hidden font-mono text-[10px] text-white/38 sm:block">{key.created}</span>
                  <span className="hidden font-mono text-[10px] text-white/38 sm:block">{key.lastUsed}</span>
                  <span className="hidden font-mono text-[10px] text-white/38 sm:block">{key.team}</span>
                  <ChevronDown className={`h-4 w-4 text-white/25 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid overflow-hidden bg-black/25 transition-[grid-template-rows] duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="min-h-0">
                    <div className="border-t border-white/[0.05] px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-2 font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Granted scopes</span>
                        {key.scopes.map((scope) => <span key={scope} className="border border-white/10 bg-white/[0.025] px-2 py-1 font-mono text-[9px] text-white/48">{scope}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm" onMouseDown={closeDrawer}>
          <aside className="key-drawer access-scroll ml-auto flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l border-white/12 bg-[#0a0a0a]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex h-[72px] shrink-0 items-center border-b border-white/10 px-5">
              <div><p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Credential constructor</p><h2 className="mt-1 text-lg font-semibold">Generate API key</h2></div>
              <button type="button" onClick={closeDrawer} aria-label="Close" className="ml-auto grid h-9 w-9 place-items-center border border-white/12 text-white/35 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {generatedKey ? (
              <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
                <ShieldCheck className="h-9 w-9 text-emerald-300" strokeWidth={1.4} />
                <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-300/65">Key generated</p>
                <h3 className="mt-2 text-2xl font-semibold">This secret appears once.</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/42">Store it in your secret manager now. Closing this panel permanently hides the credential.</p>
                <div className="mt-6 break-all border border-amber-500/25 bg-amber-500/[0.055] p-4 font-mono text-[11px] leading-5 text-amber-100/75">{generatedKey}</div>
                <button type="button" onClick={copyKey} className="mt-3 flex h-11 items-center justify-center gap-2 border border-white bg-white font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black hover:bg-emerald-300">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied to clipboard' : 'Copy secret'}</button>
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); generateKey(); }} className="flex flex-1 flex-col p-5">
                <FieldLabel>Key label</FieldLabel>
                <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Production worker" className="mt-2 h-11 border border-white/12 bg-black/30 px-3 text-sm outline-none placeholder:text-white/18 focus:border-white/40" />

                <FieldLabel className="mt-5">Assigned team</FieldLabel>
                <select value={team} onChange={(event) => setTeam(event.target.value)} className="mt-2 h-11 border border-white/12 bg-black/30 px-3 text-sm text-white/65 outline-none focus:border-white/40">
                  <option>Team Alpha</option><option>Team Beta</option>
                </select>

                <FieldLabel className="mt-5">Scope preset</FieldLabel>
                <div className="mt-2 grid grid-cols-3 border border-white/10 p-1">
                  {(['full', 'read', 'custom'] as const).map((item) => <button key={item} type="button" onClick={() => setPreset(item)} className={`px-2 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition ${preset === item ? 'bg-white text-black' : 'text-white/35 hover:bg-white/[0.04] hover:text-white'}`}>{item === 'read' ? 'Read only' : item}</button>)}
                </div>

                <div className="mt-5 flex items-center justify-between"><FieldLabel>Effective scopes</FieldLabel><span className="font-mono text-[9px] text-white/25">{selectedScopes.length} / 18</span></div>
                <div className="mt-2 max-h-[300px] overflow-y-auto border border-white/10">
                  {ALL_SCOPES.map((scope) => {
                    const checked = selectedScopes.includes(scope.id);
                    return <button key={scope.id} type="button" disabled={preset !== 'custom'} onClick={() => toggleCustomScope(scope.id)} className="flex w-full items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 text-left last:border-b-0 disabled:cursor-default"><span className={`grid h-5 w-5 place-items-center border ${checked ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300' : 'border-white/10 text-transparent'}`}><Check className="h-3 w-3" /></span><span className={`font-mono text-[10px] ${checked ? 'text-white/65' : 'text-white/25'}`}>{scope.id}</span></button>;
                  })}
                </div>

                <div className="mt-auto border-t border-white/10 pt-5">
                  <p className="mb-4 font-mono text-[8px] uppercase tracking-[0.14em] text-amber-200/45">Key material cannot be recovered after this panel closes.</p>
                  <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 border border-white bg-white font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black hover:bg-emerald-300"><Plus className="h-4 w-4" /> Generate credential</button>
                </div>
              </form>
            )}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function FieldLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 ${className}`}>{children}</label>;
}

