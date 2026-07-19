'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, KeyRound, Plus, ShieldAlert, X } from 'lucide-react';
import { ENTITIES, INITIAL_GRANTS, getScope, type AccessEntity } from './access-data';
import { LivePreview } from './live-preview';
import { PermissionMatrix } from './permission-matrix';
import { ScopeTree } from './scope-tree';

type PendingGrant = { scopeId: string; entityIds: string[] } | null;

export function ScopeManager() {
  const [entities, setEntities] = useState<AccessEntity[]>(ENTITIES);
  const [grants, setGrants] = useState<Record<string, string[]>>(() => structuredClone(INITIAL_GRANTS));
  const [selectedScope, setSelectedScope] = useState('events:stream');
  const [focusedEntity, setFocusedEntity] = useState('team-alpha');
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [draft, setDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState('2m ago');
  const [pendingGrant, setPendingGrant] = useState<PendingGrant>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamName, setTeamName] = useState('');

  const focused = entities.find((entity) => entity.id === focusedEntity) ?? entities[0];
  const focusedGrants = grants[focused.id] ?? [];
  const unionCount = useMemo(
    () => new Set(entities.flatMap((entity) => grants[entity.id] ?? [])).size,
    [entities, grants],
  );

  const registerChange = (scopeId: string) => {
    setLastChanged(scopeId);
    setDraft(true);
    window.setTimeout(() => setLastChanged((current) => (current === scopeId ? null : current)), 500);
  };

  const applyGrant = (scopeId: string, entityIds: string[], value = true) => {
    setGrants((current) => {
      const next = { ...current };
      entityIds.forEach((entityId) => {
        const scopes = new Set(next[entityId] ?? []);
        if (value) scopes.add(scopeId);
        else scopes.delete(scopeId);
        next[entityId] = [...scopes];
      });
      return next;
    });
    registerChange(scopeId);
  };

  const toggleScope = (scopeId: string, entityId: string) => {
    const granted = grants[entityId]?.includes(scopeId) ?? false;
    const scope = getScope(scopeId);
    if (!granted && scope.risk === 'critical') {
      setPendingGrant({ scopeId, entityIds: [entityId] });
      return;
    }
    applyGrant(scopeId, [entityId], !granted);
  };

  const bulkAction = (action: 'grant' | 'revoke' | 'copy') => {
    if (action === 'copy') {
      const sourceId = focusedEntity === 'team-alpha' ? 'team-beta' : 'team-alpha';
      const value = grants[sourceId]?.includes(selectedScope) ?? false;
      applyGrant(selectedScope, [focusedEntity], value);
      return;
    }

    const value = action === 'grant';
    const scope = getScope(selectedScope);
    if (value && scope.risk === 'critical') {
      const deniedEntityIds = entities.filter((entity) => !grants[entity.id]?.includes(selectedScope)).map((entity) => entity.id);
      if (deniedEntityIds.length) setPendingGrant({ scopeId: selectedScope, entityIds: deniedEntityIds });
      return;
    }
    applyGrant(selectedScope, entities.map((entity) => entity.id), value);
  };

  const publish = () => {
    setDraft(false);
    setLastSaved('now');
  };

  const addTeam = () => {
    const label = teamName.trim();
    if (!label) return;
    const id = `team-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const entity: AccessEntity = { id, label, shortLabel: label.split(/\s+/).at(-1) ?? label, type: 'team' };
    setEntities((current) => [...current, entity]);
    setGrants((current) => ({ ...current, [id]: [] }));
    setFocusedEntity(id);
    setTeamName('');
    setShowAddTeam(false);
    setDraft(true);
  };

  return (
    <main className="flex min-h-[calc(100dvh-48px)] min-w-0 max-w-full flex-col overflow-x-hidden sm:min-h-[calc(100dvh-26px)]">
      <header className="shrink-0 border-b border-white/10">
        <div className="flex min-h-[70px] flex-wrap items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
              <span>Access surface</span><span className="text-white/12">/</span><span>SDK permission layer</span>
            </div>
            <p className="mt-1.5 text-xs text-white/35">Effective access, before it reaches production.</p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:ml-auto sm:w-auto sm:justify-end sm:gap-3">
            <span className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${draft ? 'draft-badge border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-300'}`}>
              {draft ? 'Draft' : 'Synced'}
            </span>
            <span className="hidden font-mono text-[9px] text-white/25 md:inline">last saved {lastSaved}</span>
            <Link href="/sdk/keys" className="hidden items-center gap-2 border border-white/12 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition hover:border-white/35 hover:text-white lg:flex">
              <KeyRound className="h-3.5 w-3.5" /> API keys
            </Link>
            <button type="button" onClick={publish} disabled={!draft} className={`flex items-center gap-2 border px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] transition ${draft ? 'publish-ready border-white bg-white text-black hover:bg-emerald-300' : 'cursor-not-allowed border-white/10 bg-white/[0.03] text-white/20'}`}>
              <span className="sm:hidden">Publish</span><span className="hidden sm:inline">Publish changes</span> <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="access-scroll flex h-9 items-center gap-4 overflow-x-auto border-t border-white/[0.06] bg-white/[0.018] px-4 font-mono text-[9px] uppercase tracking-[0.16em] text-white/28 sm:px-5 lg:px-6">
          <Metric label="SDK version" value="v1.4.2" />
          <Metric label="Active keys" value="3" />
          <Metric label="Teams with access" value={String(entities.filter((entity) => entity.type === 'team').length)} />
          <Metric label="Scopes granted" value={`${unionCount} / 18`} strong />
          <span className="ml-auto hidden items-center gap-2 whitespace-nowrap text-emerald-300/55 lg:flex"><span className="live-dot h-1.5 w-1.5 bg-emerald-400" /> Policy engine online</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(620px,1fr)_340px]">
        <ScopeTree selectedScope={selectedScope} entities={entities} grants={grants} onSelect={setSelectedScope} />
        <PermissionMatrix
          selectedScope={selectedScope}
          focusedEntity={focusedEntity}
          entities={entities}
          grants={grants}
          onSelectScope={setSelectedScope}
          onFocusEntity={setFocusedEntity}
          onToggle={toggleScope}
          onBulk={bulkAction}
          onAddTeam={() => setShowAddTeam(true)}
        />
        <LivePreview entity={focused} grantedScopes={focusedGrants} lastChanged={lastChanged} />
      </div>

      {pendingGrant ? (
        <CriticalGrantModal
          scopeId={pendingGrant.scopeId}
          count={pendingGrant.entityIds.length}
          onCancel={() => setPendingGrant(null)}
          onConfirm={() => {
            applyGrant(pendingGrant.scopeId, pendingGrant.entityIds, true);
            setPendingGrant(null);
          }}
        />
      ) : null}

      {showAddTeam ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setShowAddTeam(false)}>
          <form onSubmit={(event) => { event.preventDefault(); addTeam(); }} onMouseDown={(event) => event.stopPropagation()} className="vault-panel w-full max-w-md bg-[#0c0c0c] p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Access entity</p><h2 className="mt-2 text-xl font-semibold">Add a team</h2></div>
              <button type="button" onClick={() => setShowAddTeam(false)} aria-label="Close" className="grid h-8 w-8 place-items-center border border-white/12 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <label className="mt-6 block font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Team name</label>
            <input autoFocus value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Platform Operations" className="mt-2 h-11 w-full border border-white/12 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/40" />
            <button type="submit" className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-white font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-black hover:bg-emerald-300"><Plus className="h-4 w-4" /> Add team</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <span className="flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-white/10 pr-4"><span>{label}</span><strong className={strong ? 'font-medium text-white' : 'font-medium text-white/55'}>{value}</strong></span>;
}

function CriticalGrantModal({ scopeId, count, onCancel, onConfirm }: { scopeId: string; count: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={onCancel}>
      <div className="vault-panel w-full max-w-lg bg-[#0c0c0c] p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <ShieldAlert className="h-8 w-8 text-red-300" strokeWidth={1.4} />
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.28em] text-red-300/65">Critical permission</p>
        <h2 className="mt-2 break-all font-mono text-xl font-semibold text-white">{scopeId}</h2>
        <p className="mt-3 text-sm leading-6 text-white/45">This scope can mutate production access or credentials. You are granting it to {count} access {count === 1 ? 'entity' : 'entities'}.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="border border-white/15 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/50 hover:border-white/40 hover:text-white">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex items-center gap-2 border border-red-400/70 bg-red-500/15 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-red-200 hover:bg-red-500/25"><Check className="h-3.5 w-3.5" /> Confirm grant</button>
        </div>
      </div>
    </div>
  );
}
