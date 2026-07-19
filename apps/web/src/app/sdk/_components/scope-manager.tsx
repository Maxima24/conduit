'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ArrowRight, Check, FileJson2, Save, ShieldAlert } from 'lucide-react';
import { ENTITIES, INITIAL_GRANTS, getScope, type AccessEntity } from './access-data';
import { CapabilityMatrix } from './capability-matrix';
import { CapabilitySurface } from './capability-surface';
import { CAPABILITIES } from './control-data';
import { PermissionInspector, useInspectorResize, type InspectorEvent } from './permission-inspector';
import { ScopeBuilder } from './scope-builder';
import { SimulationLane } from './simulation-lane';

gsap.registerPlugin(useGSAP);

type PendingGrant = { scopeId: string; entityIds: string[] } | null;

const INITIAL_HISTORY: InspectorEvent[] = [
  { id: 'history-1', action: 'Published', detail: 'Production SDK policy v1.4.2', time: '2m ago', tone: 'success' },
  { id: 'history-2', action: 'Modified', detail: 'events:stream granted to Team Alpha', time: '19m ago' },
  { id: 'history-3', action: 'Rotated', detail: 'KEY-001 credential material', time: '2d ago', tone: 'warning' },
  { id: 'history-4', action: 'Created', detail: 'Team Beta access entity', time: '8d ago' },
];

export function ScopeManager() {
  const rootRef = useRef<HTMLElement>(null);
  const [entities] = useState<AccessEntity[]>(ENTITIES);
  const [grants, setGrants] = useState<Record<string, string[]>>(() => structuredClone(INITIAL_GRANTS));
  const [selectedCapability, setSelectedCapability] = useState('events');
  const [selectedScope, setSelectedScope] = useState('events:stream');
  const [focusedEntity, setFocusedEntity] = useState('team-alpha');
  const [connected, setConnected] = useState(true);
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [unpublished, setUnpublished] = useState(false);
  const [lastSaved, setLastSaved] = useState('2m ago');
  const [pendingGrant, setPendingGrant] = useState<PendingGrant>(null);
  const [history, setHistory] = useState<InspectorEvent[]>(INITIAL_HISTORY);
  const [notice, setNotice] = useState<string | null>(null);
  const { width: inspectorWidth, startResize } = useInspectorResize();

  const focused = entities.find((entity) => entity.id === focusedEntity) ?? entities[0];
  const focusedGrants = grants[focused.id] ?? [];
  const effectiveGrants = connected ? focusedGrants : [];
  const unionCount = useMemo(
    () => new Set(entities.flatMap((entity) => grants[entity.id] ?? [])).size,
    [entities, grants],
  );

  useGSAP(
    () => {
      gsap.from('[data-command-head] > *', {
        y: 8,
        opacity: 0.84,
        stagger: 0.08,
        duration: 0.52,
        ease: 'power3.out',
      });
      gsap.to('[data-control-grid]', {
        backgroundPosition: '120px 84px, 0 0',
        duration: 24,
        repeat: -1,
        ease: 'none',
      });
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!lastChanged) return;
      gsap.fromTo(
        '[data-permission-signal]',
        { xPercent: -10, opacity: 0 },
        { xPercent: 105, opacity: 1, duration: 0.9, ease: 'power2.inOut' },
      );
    },
    { scope: rootRef, dependencies: [lastChanged] },
  );

  const pushHistory = (action: string, detail: string, tone: InspectorEvent['tone'] = 'neutral') => {
    setHistory((current) => [
      { id: `history-${Date.now()}-${Math.random()}`, action, detail, time: 'now', tone },
      ...current,
    ]);
  };

  const registerChange = (scopeId: string, granted: boolean, entityLabel = focused.label) => {
    setLastChanged(scopeId);
    setDirty(true);
    setUnpublished(true);
    pushHistory(granted ? 'Granted' : 'Revoked', `${scopeId} ${granted ? 'granted to' : 'revoked from'} ${entityLabel}`, granted ? 'success' : 'warning');
    window.setTimeout(() => setLastChanged((current) => (current === scopeId ? null : current)), 900);
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
    const targetLabel = entityIds.length === 1
      ? entities.find((entity) => entity.id === entityIds[0])?.label ?? focused.label
      : `${entityIds.length} access entities`;
    registerChange(scopeId, value, targetLabel);
  };

  const toggleScope = (scopeId: string, entityId = focused.id) => {
    setSelectedScope(scopeId);
    const capability = CAPABILITIES.find((item) => item.scopes.includes(scopeId));
    if (capability) setSelectedCapability(capability.id);

    const granted = grants[entityId]?.includes(scopeId) ?? false;
    const scope = getScope(scopeId);
    if (!granted && scope.risk === 'critical') {
      setPendingGrant({ scopeId, entityIds: [entityId] });
      return;
    }
    applyGrant(scopeId, [entityId], !granted);
  };

  const selectCapability = (capabilityId: string, scopeId: string) => {
    setSelectedCapability(capabilityId);
    setSelectedScope(scopeId);
  };

  const updateConnection = (nextConnected: boolean) => {
    setConnected(nextConnected);
    setUnpublished(true);
    setDirty(true);
    pushHistory(nextConnected ? 'Connected' : 'Disconnected', `${focused.label} permission path ${nextConnected ? 'restored' : 'interrupted'}`, nextConnected ? 'success' : 'warning');
  };

  const generatePolicy = async () => {
    const policy = JSON.stringify({ entity: focused.id, connected, permissions: effectiveGrants }, null, 2);
    await navigator.clipboard.writeText(policy);
    setNotice('Policy generated and copied');
    window.setTimeout(() => setNotice(null), 1800);
  };

  const saveChanges = () => {
    setDirty(false);
    setLastSaved('now');
    pushHistory('Saved', `Draft policy saved for ${focused.label}`);
    setNotice('Draft saved');
    window.setTimeout(() => setNotice(null), 1500);
  };

  const publish = () => {
    const sweep = document.querySelector<HTMLElement>('.policy-publish-sweep');
    const statusLabel = rootRef.current?.querySelector<HTMLElement>('[data-status-label]');
    const liveReadouts = rootRef.current?.querySelectorAll<HTMLElement>('[data-live-readout]');

    if (sweep) {
      gsap.fromTo(sweep, { width: 0, opacity: 1 }, {
        width: '100%',
        opacity: 1,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => { gsap.to(sweep, { opacity: 0, duration: 0.25 }); },
      });
    }
    if (liveReadouts?.length) {
      gsap.to(liveReadouts, {
        color: '#00ff94',
        duration: 0.2,
        repeat: 1,
        yoyo: true,
        stagger: 0.03,
        clearProps: 'color',
      });
    }

    const commitPublish = () => {
      setDirty(false);
      setUnpublished(false);
      setLastSaved('now');
      pushHistory('Published', `${focused.label} configuration moved to production`, 'success');
      setNotice('Configuration published');
      window.setTimeout(() => setNotice(null), 1800);
      window.requestAnimationFrame(() => {
        if (statusLabel) gsap.fromTo(statusLabel, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' });
      });
    };

    if (statusLabel) gsap.to(statusLabel, { opacity: 0, duration: 0.15, onComplete: commitPublish });
    else commitPublish();
  };

  const status = dirty ? 'Draft' : unpublished ? 'Saved' : 'Synced';

  return (
    <main ref={rootRef} className="flex min-h-[calc(100dvh-48px)] w-full min-w-0 max-w-full flex-col overflow-x-hidden sm:min-h-[calc(100dvh-26px)] xl:h-[calc(100dvh-26px)] xl:overflow-hidden">
      <header className="command-chassis relative z-20 shrink-0 bg-[#080808]/94 backdrop-blur-xl">
        <div data-command-head className="flex min-h-[108px] flex-wrap items-center gap-5 px-4 py-4 sm:px-5 lg:px-7">
          <div className="mobile-command-copy w-full min-w-0 sm:w-auto">
            <h1 className="font-mono text-[10px] font-medium uppercase tracking-[0.42em] text-white/48 sm:text-[11px]">SDK Access Surface</h1>
            <p className="mt-3 max-w-[620px] font-sans text-lg leading-7 text-white/78 sm:text-xl">
              Configure exactly what your organization<br className="hidden lg:block" /> allows developers to access.
            </p>
          </div>

          <div className="command-dock flex w-full flex-wrap items-center gap-px sm:ml-auto sm:w-auto sm:justify-end">
            <span data-status-label className={`mr-1 border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${status === 'Draft' ? 'draft-badge border-amber-400/35 bg-amber-400/[0.08] text-amber-200' : status === 'Saved' ? 'border-white/20 bg-white/[0.04] text-white/50' : 'border-[#00ff94]/30 bg-[#00ff94]/[0.06] text-[#00ff94]/70'}`}>{status}</span>
            <button type="button" onClick={generatePolicy} className="command-button"><FileJson2 className="h-3.5 w-3.5" /> Generate policy</button>
            <button type="button" onClick={saveChanges} disabled={!dirty} className="command-button"><Save className="h-3.5 w-3.5" /> Save changes</button>
            <button type="button" onClick={publish} disabled={!unpublished} className={`command-button is-primary ${unpublished ? 'publish-ready' : ''}`}>Publish configuration <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="command-status-rail access-scroll flex h-9 items-center gap-4 overflow-x-auto bg-white/[0.018] px-4 font-mono text-[8px] uppercase tracking-[0.15em] text-white/25 sm:px-5 lg:px-7">
          <Metric label="SDK version" value="v1.4.2" />
          <Metric label="Active keys" value="3" />
          <Metric label="Entity" value={focused.label} />
          <Metric label="Capabilities" value={`${unionCount} / 18`} strong />
          <Metric label="Last saved" value={lastSaved} />
          <span className="ml-auto hidden items-center gap-2 whitespace-nowrap text-emerald-300/55 lg:flex"><span className="live-dot h-1.5 w-1.5 bg-emerald-400" /> Policy engine online</span>
        </div>
      </header>

      <div className="relative flex w-full min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
        {lastChanged ? (
          <div className="permission-signal-track pointer-events-none absolute left-[12%] right-[3%] top-0 z-40 hidden h-px overflow-hidden xl:block">
            <span data-permission-signal className="absolute -top-[2px] h-[5px] w-24 bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.72)]" />
          </div>
        ) : null}
        <div
          data-control-grid
          className="control-workspace access-scroll relative min-w-0 flex-1 overflow-y-auto bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:44px_44px]"
        >
          <div className="relative mx-auto w-full min-w-0 max-w-[1460px] space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <CapabilitySurface
              selectedId={selectedCapability}
              focusedLabel={focused.label}
              grants={effectiveGrants}
              editing={Boolean(lastChanged)}
              onSelect={selectCapability}
              onToggle={(scopeId) => toggleScope(scopeId)}
            />
            <ScopeBuilder
              entities={entities}
              focusedEntity={focused}
              effectiveCount={effectiveGrants.length}
              connected={connected}
              onFocus={setFocusedEntity}
              onConnectionChange={updateConnection}
            />
            <CapabilityMatrix
              grants={effectiveGrants}
              selectedScope={selectedScope}
              onSelectScope={setSelectedScope}
              onToggle={(scopeId) => toggleScope(scopeId)}
            />
            <SimulationLane entityLabel={focused.label} grants={effectiveGrants} />
          </div>
        </div>

        <PermissionInspector
          entity={focused}
          grants={effectiveGrants}
          lastChanged={lastChanged}
          history={history}
          width={inspectorWidth}
          onResizeStart={startResize}
        />
      </div>

      {notice ? (
        <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 border border-emerald-400/30 bg-[#0b0b0b]/95 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-200 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-xl sm:bottom-6">
          {notice}
        </div>
      ) : null}

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
    </main>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <span className="flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-white/10 pr-4"><span>{label}</span><strong className={strong ? 'font-medium text-white' : 'font-medium text-white/55'}>{value}</strong></span>;
}

function CriticalGrantModal({ scopeId, count, onCancel, onConfirm }: { scopeId: string; count: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={onCancel}>
      <div className="vault-panel w-full max-w-lg bg-[#0c0c0c] p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <ShieldAlert className="h-8 w-8 text-red-300" strokeWidth={1.4} />
        <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.24em] text-red-300/65">Critical permission</p>
        <h2 className="mt-2 break-all font-mono text-xl font-semibold text-white">{scopeId}</h2>
        <p className="mt-3 text-sm leading-6 text-white/45">This permission can mutate production policy or credentials. It will be granted to {count} access {count === 1 ? 'entity' : 'entities'}.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="border border-white/15 px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/50 hover:border-white/40 hover:text-white">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex items-center gap-2 border border-red-400/70 bg-red-500/15 px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.14em] text-red-200 hover:bg-red-500/25"><Check className="h-3.5 w-3.5" /> Confirm grant</button>
        </div>
      </div>
    </div>
  );
}
