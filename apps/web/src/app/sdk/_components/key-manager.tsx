'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ArrowLeft, ArrowUpRight, CalendarClock, Check, Copy, KeyRound, Plus, ShieldCheck, UserRound, X } from 'lucide-react';
import { ALL_SCOPES, INITIAL_GRANTS } from './access-data';

gsap.registerPlugin(useGSAP);

type KeyRecord = {
  id: string;
  label: string;
  created: string;
  lastUsed: string;
  team: string;
  status: 'Active' | 'Revoked';
  environment: 'Production' | 'Development' | 'Testing' | 'Legacy';
  rotation: string;
  owner: string;
  scopes: string[];
};

const INITIAL_KEYS: KeyRecord[] = [
  { id: 'KEY-001', label: 'Primary event ingress', created: 'Jul 02, 2026', lastUsed: '18s ago', team: 'Team Alpha', status: 'Active', environment: 'Production', rotation: 'Aug 24, 2026', owner: 'Mara Chen', scopes: INITIAL_GRANTS['key-001'] },
  { id: 'KEY-002', label: 'Delivery observer', created: 'Jun 18, 2026', lastUsed: '11m ago', team: 'Team Beta', status: 'Active', environment: 'Development', rotation: 'Sep 01, 2026', owner: 'Idris Vale', scopes: INITIAL_GRANTS['key-002'] },
  { id: 'KEY-003', label: 'Replay verification', created: 'Jun 05, 2026', lastUsed: '42m ago', team: 'Team Alpha', status: 'Active', environment: 'Testing', rotation: 'Jul 28, 2026', owner: 'Quality Systems', scopes: ['events:read', 'sends:read', 'sends:replay'] },
  { id: 'KEY-004', label: 'Retired worker', created: 'May 29, 2026', lastUsed: '14d ago', team: 'Team Alpha', status: 'Revoked', environment: 'Legacy', rotation: 'Disabled', owner: 'Platform Archive', scopes: INITIAL_GRANTS['key-003'] },
];

type ScopePreset = 'full' | 'read' | 'custom';

export function KeyManager() {
  const rootRef = useRef<HTMLElement>(null);
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [selectedKey, setSelectedKey] = useState<KeyRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [team, setTeam] = useState('Team Alpha');
  const [preset, setPreset] = useState<ScopePreset>('read');
  const [customScopes, setCustomScopes] = useState<string[]>(['events:read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      gsap.from('[data-key-card]', {
        opacity: 0.84,
        y: 8,
        stagger: 0.09,
        duration: 0.52,
        ease: 'power3.out',
      });
    },
    { scope: rootRef },
  );

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
      { id, label: label.trim() || 'Untitled key', created: 'Just now', lastUsed: 'Never', team, status: 'Active', environment: 'Production', rotation: 'Oct 17, 2026', owner: 'Current operator', scopes: selectedScopes },
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
    <main ref={rootRef} className="min-h-[calc(100dvh-48px)] w-full min-w-0 max-w-full overflow-x-hidden sm:min-h-[calc(100dvh-26px)]">
      <header className="border-b border-white/10">
        <div className="flex min-h-[72px] flex-wrap items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <div className="mobile-command-copy w-full min-w-0 sm:w-auto">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
              <span>Credential vault</span><span className="text-white/12">/</span><span>API keys</span>
            </div>
            <p className="mt-1.5 text-xs text-white/35">Issue narrowly scoped credentials. Reveal secrets once.</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <Link href="/sdk/scopes" className="hidden items-center gap-2 border border-white/12 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition hover:border-white/35 hover:text-white sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Scope matrix
            </Link>
            <button type="button" onClick={() => { setSelectedKey(null); setDrawerOpen(true); }} className="flex items-center gap-2 border border-white bg-white px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-emerald-300">
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

      <div className="control-workspace relative min-h-[calc(100dvh-157px)] bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:44px_44px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_16%,rgba(110,231,183,.04),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(255,255,255,.025),transparent_24%)]" />
        <div className="credential-surface relative mx-auto w-full min-w-0 max-w-[1420px] px-4 py-7 sm:px-6 lg:py-10">
          <div className="mb-5 flex flex-wrap items-end gap-3 border-b border-white/[0.08] pb-4">
            <div><p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/27">Credential modules</p><h1 className="mt-1 text-xl font-semibold text-white/88 sm:text-2xl">Keys attached to the access surface.</h1></div>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-white/20">{String(keys.length).padStart(2, '0')} credentials</span>
          </div>

          <section className="grid w-full min-w-0 grid-cols-1 gap-px border border-white/[0.08] bg-white/[0.08] md:grid-cols-2 xl:grid-cols-4">
            {keys.map((key, index) => (
              <KeyCard key={key.id} record={key} index={index} onClick={() => setSelectedKey(key)} />
            ))}
          </section>

          <section className="mt-10 border-t border-white/[0.08] pt-5">
            <div className="grid gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
              <VaultMetric label="Rotation coverage" value="75%" detail="3 of 4 within policy" />
              <VaultMetric label="Scope density" value="3.5" detail="average grants per key" />
              <VaultMetric label="Credential activity" value="03" detail="keys used this hour" />
            </div>
          </section>
        </div>
      </div>

      {selectedKey ? (
        <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm" onMouseDown={() => setSelectedKey(null)}>
          <aside className="key-drawer access-scroll ml-auto flex h-full w-full max-w-[460px] flex-col overflow-y-auto border-l border-white/12 bg-[#0a0a0a]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex h-[72px] shrink-0 items-center border-b border-white/10 px-5">
              <div><p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">Credential inspector</p><h2 className="mt-1 text-lg font-semibold">{selectedKey.id}</h2></div>
              <button type="button" onClick={() => setSelectedKey(null)} aria-label="Close" className="ml-auto grid h-9 w-9 place-items-center border border-white/12 text-white/35 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5">
              <div className={`border p-4 ${keyTone(selectedKey).panel}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className={`font-mono text-[9px] uppercase tracking-[0.2em] ${keyTone(selectedKey).text}`}>{selectedKey.environment}</p><h3 className="mt-2 text-2xl font-semibold text-white/90">{selectedKey.label}</h3></div>
                  <span className={`border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${selectedKey.status === 'Active' ? 'border-emerald-400/25 text-emerald-300/70' : 'border-white/10 text-white/25'}`}>{selectedKey.status}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08]">
                <InspectorMetric label="Last used" value={selectedKey.lastUsed} />
                <InspectorMetric label="Rotation" value={selectedKey.rotation} />
                <InspectorMetric label="Owner" value={selectedKey.owner} />
                <InspectorMetric label="Team" value={selectedKey.team} />
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Effective scopes</p><span className="font-mono text-[9px] text-white/25">{selectedKey.scopes.length}</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedKey.scopes.map((scope) => <span key={scope} className="border border-white/10 bg-white/[0.025] px-2 py-1.5 font-mono text-[9px] text-white/48">{scope}</span>)}
                </div>
              </div>

              <div className="mt-7 border-t border-white/10 pt-5">
                <button type="button" onClick={() => { setSelectedKey(null); setDrawerOpen(true); }} className="flex h-10 w-full items-center justify-center gap-2 border border-white bg-white font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-emerald-300"><CalendarClock className="h-4 w-4" /> Rotate credential</button>
                <button
                  type="button"
                  disabled={selectedKey.status === 'Revoked'}
                  onClick={() => {
                    setKeys((current) => current.map((key) => key.id === selectedKey.id ? { ...key, status: 'Revoked' } : key));
                    setSelectedKey((current) => current ? { ...current, status: 'Revoked' } : current);
                  }}
                  className="mt-2 h-10 w-full border border-red-400/20 bg-red-400/[0.045] font-mono text-[9px] uppercase tracking-[0.14em] text-red-200/60 hover:border-red-400/40 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Revoke access
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

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

function KeyCard({ record, index, onClick }: { record: KeyRecord; index: number; onClick: () => void }) {
  const tone = keyTone(record);
  return (
    <button
      type="button"
      data-key-card
      onClick={onClick}
      className={`group/key relative min-h-[300px] overflow-hidden bg-[#0b0b0b] p-5 text-left transition duration-300 hover:-translate-y-1 hover:bg-[#0d0d0d] hover:shadow-[0_20px_55px_rgba(0,0,0,.36)] ${tone.hover}`}
    >
      <span className={`absolute inset-x-0 top-0 h-px ${tone.line}`} />
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center border ${tone.icon}`}><KeyRound className="h-[18px] w-[18px]" strokeWidth={1.5} /></span>
        <div className="text-right"><p className="font-mono text-[8px] text-white/18">K-{String(index + 1).padStart(2, '0')}</p><p className={`mt-1 font-mono text-[8px] uppercase tracking-[0.16em] ${tone.text}`}>{record.environment}</p></div>
      </div>

      <div className="mt-8">
        <p className="font-mono text-[9px] text-white/28">{record.id}</p>
        <h2 className="mt-2 text-xl font-semibold text-white/86">{record.label}</h2>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/22">{record.status} / {record.team}</p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4">
        <div><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/20">Last used</p><p className="mt-1 text-xs text-white/52">{record.lastUsed}</p></div>
        <div><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/20">Scopes</p><p className="mt-1 text-xs text-white/52">{record.scopes.length} granted</p></div>
        <div><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/20">Rotation</p><p className="mt-1 truncate text-xs text-white/52">{record.rotation}</p></div>
        <div><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/20">Owner</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/52"><UserRound className="h-3 w-3" /> {record.owner}</p></div>
      </div>

      <span className="absolute bottom-4 right-4 grid h-7 w-7 place-items-center border border-white/8 text-white/18 transition group-hover/key:border-white/25 group-hover/key:text-white/65"><ArrowUpRight className="h-3.5 w-3.5" /></span>
    </button>
  );
}

function VaultMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="bg-[#0b0b0b] p-4"><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/22">{label}</p><p className="mt-3 font-mono text-2xl text-white/76">{value}</p><p className="mt-1 text-[11px] text-white/28">{detail}</p></div>;
}

function InspectorMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#0b0b0b] p-3"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/22">{label}</p><p className="mt-2 truncate text-xs text-white/58">{value}</p></div>;
}

function keyTone(record: KeyRecord) {
  if (record.status === 'Revoked' || record.environment === 'Legacy') {
    return { line: 'bg-white/18', icon: 'border-white/10 bg-white/[0.025] text-white/25', text: 'text-white/28', hover: 'hover:shadow-white/[0.025]', panel: 'border-white/10 bg-white/[0.02]' };
  }
  if (record.environment === 'Development') {
    return { line: 'bg-sky-300/55', icon: 'border-sky-400/25 bg-sky-400/[0.06] text-sky-300', text: 'text-sky-300/65', hover: 'hover:shadow-sky-500/[0.04]', panel: 'border-sky-400/20 bg-sky-400/[0.035]' };
  }
  if (record.environment === 'Testing') {
    return { line: 'bg-amber-300/55', icon: 'border-amber-400/25 bg-amber-400/[0.06] text-amber-300', text: 'text-amber-300/65', hover: 'hover:shadow-amber-500/[0.04]', panel: 'border-amber-400/20 bg-amber-400/[0.035]' };
  }
  return { line: 'bg-emerald-300/65', icon: 'border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300', text: 'text-emerald-300/65', hover: 'hover:shadow-emerald-500/[0.05]', panel: 'border-emerald-400/20 bg-emerald-400/[0.035]' };
}

function FieldLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 ${className}`}>{children}</label>;
}
