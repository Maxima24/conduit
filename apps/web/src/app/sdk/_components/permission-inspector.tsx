'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { Check, Copy, GripVertical, TerminalSquare } from 'lucide-react';
import { ALL_SCOPES, SCOPE_GROUPS, type AccessEntity } from './access-data';
import { ENDPOINTS } from './control-data';

gsap.registerPlugin(useGSAP);

export type InspectorEvent = {
  id: string;
  action: string;
  detail: string;
  time: string;
  tone?: 'neutral' | 'warning' | 'success';
};

type PermissionInspectorProps = {
  entity: AccessEntity;
  grants: string[];
  lastChanged: string | null;
  history: InspectorEvent[];
  width: number;
  onResizeStart: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function PermissionInspector(props: PermissionInspectorProps) {
  const { entity, grants, lastChanged, history, width, onResizeStart } = props;
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const risk = useMemo(() => calculateRisk(grants), [grants]);
  const previousRiskRef = useRef(risk.score);
  const enabledEndpoints = ENDPOINTS.filter((endpoint) => grants.includes(endpoint.scope));

  useGSAP(
    () => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .fromTo(rootRef.current, { clipPath: 'inset(0 0 0 4%)', opacity: 0.9 }, { clipPath: 'inset(0 0 0 0%)', opacity: 1, duration: 0.58 })
        .from('[data-inspector-section]', { x: 5, opacity: 0.82, stagger: 0.07, duration: 0.38 }, '-=0.32');
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!lastChanged) return;
      gsap.fromTo(
        '.code-scope-line.is-changing',
        { clipPath: 'inset(0 100% 0 0)', opacity: 0.25 },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.62, ease: 'steps(12)' },
      );
    },
    { scope: rootRef, dependencies: [lastChanged] },
  );

  useGSAP(
    () => {
      if (!lastChanged) return;

      const endpointRow = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-endpoint-scope]') ?? [])
        .find((row) => row.dataset.endpointScope === lastChanged);
      const endpointStatus = endpointRow?.querySelector<HTMLElement>('[data-endpoint-status]');
      if (endpointRow) {
        gsap.fromTo(
          endpointRow,
          { backgroundColor: 'rgba(0,255,148,.09)' },
          { backgroundColor: 'rgba(0,255,148,0)', duration: 0.4, ease: 'power2.out', clearProps: 'backgroundColor' },
        );
      }
      if (endpointStatus) {
        const finalOpacity = grants.includes(lastChanged) ? 1 : 0.28;
        gsap.timeline()
          .set(endpointStatus, { opacity: 1 })
          .to(endpointStatus, { opacity: 0, duration: 0.08, ease: 'none' })
          .to(endpointStatus, { opacity: 1, duration: 0.08, ease: 'none' })
          .to(endpointStatus, { opacity: 0, duration: 0.08, ease: 'none' })
          .to(endpointStatus, { opacity: finalOpacity, duration: 0.08, ease: 'none' });
      }

      const radius = 31;
      const circumference = 2 * Math.PI * radius;
      const previousScore = previousRiskRef.current;
      const arc = rootRef.current?.querySelector<SVGCircleElement>('[data-risk-arc]');
      const scoreLabel = rootRef.current?.querySelector<HTMLElement>('[data-risk-value]');
      if (arc) {
        gsap.fromTo(
          arc,
          { strokeDashoffset: circumference - (previousScore / 100) * circumference },
          { strokeDashoffset: circumference - (risk.score / 100) * circumference, duration: 0.8, ease: 'power3.inOut' },
        );
      }
      if (scoreLabel) {
        const counter = { value: previousScore };
        gsap.to(counter, {
          value: risk.score,
          duration: 0.8,
          ease: 'power3.inOut',
          onUpdate: () => { scoreLabel.textContent = String(Math.round(counter.value)); },
        });
      }
      previousRiskRef.current = risk.score;
    },
    { scope: rootRef, dependencies: [lastChanged, risk.score] },
  );

  const copyPolicy = async () => {
    await navigator.clipboard.writeText(buildPolicySource(entity, grants));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside
      ref={rootRef}
      style={{ '--inspector-width': `${width}px` } as CSSProperties}
      className="inspector-chassis relative flex w-full shrink-0 flex-col bg-[#090909] xl:w-[var(--inspector-width)]"
    >
      <button
        type="button"
        aria-label="Resize effective SDK inspector"
        title="Drag to resize inspector"
        onPointerDown={onResizeStart}
        className="group absolute inset-y-0 -left-2 z-30 hidden w-4 cursor-col-resize place-items-center xl:grid"
      >
        <span className="h-28 w-2 border border-white/15 bg-[#101010] transition group-hover:border-emerald-400/45 group-hover:bg-emerald-400/[0.08]">
          <GripVertical className="relative -left-[3px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30 group-hover:text-emerald-300" />
        </span>
      </button>

      <div className="flex h-[76px] shrink-0 items-center border-b border-white/10 px-4">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">Live inspector</p>
          <h2 className="mt-1 font-display text-base font-medium text-white/85">Effective SDK Surface</h2>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-[9px] text-white/58">{entity.label}</p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-300/55">Policy linked</p>
        </div>
      </div>

      <div className="access-scroll min-h-0 flex-1 overflow-y-auto">
        <section data-inspector-section className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 p-4">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">Permission risk</p>
            <p className={`mt-3 text-2xl font-semibold ${risk.color}`}>{risk.level}</p>
            <p className="mt-1 max-w-[190px] text-[11px] leading-5 text-white/32">Calculated from replay, mutation, admin, and credential privileges.</p>
          </div>
          <RiskDial score={risk.score} color={risk.stroke} />
        </section>

        <section data-inspector-section className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">Enabled endpoints</p>
            <span className="font-mono text-[9px] text-white/40">{enabledEndpoints.length}/{ENDPOINTS.length}</span>
          </div>
          <div className="border border-white/[0.07]">
            {ENDPOINTS.map((endpoint) => {
              const enabled = grants.includes(endpoint.scope);
              return (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  data-endpoint-scope={endpoint.scope}
                  className={`flex items-center gap-2 border-b border-white/[0.05] px-3 py-2.5 last:border-b-0 transition ${enabled ? 'bg-[#00ff94]/[0.025]' : 'opacity-25'}`}
                >
                  <span className={`w-10 font-mono text-[8px] ${enabled ? 'text-emerald-300/65' : 'text-white/25'}`}>{endpoint.method}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[9px] text-white/55">{endpoint.path}</span>
                  <span data-endpoint-status className={`h-1.5 w-1.5 ${enabled ? 'bg-[#00ff94]' : 'bg-white/15'}`} />
                </div>
              );
            })}
          </div>
        </section>

        <section data-inspector-section className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.22em] text-white/25"><TerminalSquare className="h-3.5 w-3.5" /> Generated policy</p>
            <button type="button" onClick={copyPolicy} className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/28 hover:text-white">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="overflow-x-auto border border-white/[0.07] bg-black/45 p-3 font-mono text-[9px] leading-[1.7]">
            <p><span className="text-violet-300/65">const</span> <span className="text-white/70">sdk</span> <span className="text-white/25">=</span> <span className="text-violet-300/65">new</span> <span className="text-white/70">ConduitSDK</span><span className="text-white/30">({'{'}</span></p>
            <p className="pl-3 text-white/42">apiKey,</p>
            <p className="pl-3 text-white/42">permissions: {'{'}</p>
            {SCOPE_GROUPS.map((group) => {
              const active = group.scopes.filter((scope) => grants.includes(scope.id));
              return (
                <div key={group.id} className={`code-scope-line pl-6 ${active.some((scope) => scope.id === lastChanged) ? 'is-changing' : ''}`}>
                  <span className={active.length ? 'text-emerald-200/60' : 'text-white/16'}>{group.id}: {'{'}</span>
                  {group.scopes.map((scope) => (
                    <p key={scope.id} className={`pl-3 ${grants.includes(scope.id) ? 'text-white/52' : 'text-white/13'}`}>
                      {scope.id.split(':').at(-1)}: {grants.includes(scope.id) ? 'true' : 'false'},
                    </p>
                  ))}
                  <span className={active.length ? 'text-emerald-200/60' : 'text-white/16'}>{'},'}</span>
                </div>
              );
            })}
            <p className="pl-3 text-white/30">{'}'}</p>
            <p className="text-white/30">{'});'}</p>
          </div>
        </section>

        <section data-inspector-section className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/25">Permission history</p>
            <span className="font-mono text-[8px] text-white/18">latest first</span>
          </div>
          <div className="relative pl-4 before:absolute before:inset-y-1 before:left-[3px] before:w-px before:bg-white/[0.08]">
            {history.slice(0, 7).map((event) => (
              <div key={event.id} className="relative pb-4 last:pb-0">
                <span className={`absolute -left-4 top-1 h-2 w-2 border border-[#090909] ${event.tone === 'warning' ? 'bg-amber-300' : event.tone === 'success' ? 'bg-emerald-300' : 'bg-white/28'}`} />
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-mono text-[9px] text-white/55">{event.action}</p><p className="mt-1 text-[10px] leading-4 text-white/27">{event.detail}</p></div>
                  <span className="shrink-0 font-mono text-[8px] text-white/18">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function RiskDial({ score, color }: { score: number; color: string }) {
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-[82px] w-[82px]">
      <svg viewBox="0 0 82 82" className="h-full w-full -rotate-90">
        <circle cx="41" cy="41" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4" />
        <circle data-risk-arc cx="41" cy="41" r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="square" strokeDasharray={circumference} strokeDashoffset={offset} className="risk-arc" />
      </svg>
      <span data-risk-value className="absolute inset-0 grid place-items-center font-mono text-[12px] text-white/68">{score}</span>
    </div>
  );
}

function calculateRisk(grants: string[]) {
  const score = Math.min(
    100,
    grants.reduce((total, scopeId) => {
      const scope = ALL_SCOPES.find((item) => item.id === scopeId);
      const weight = scope?.risk === 'critical' ? 18 : scope?.risk === 'high' ? 11 : scope?.risk === 'medium' ? 6 : 2;
      return total + weight;
    }, 0),
  );
  if (score >= 70) return { score, level: 'CRITICAL', color: 'text-red-300', stroke: '#fca5a5' };
  if (score >= 45) return { score, level: 'HIGH', color: 'text-orange-300', stroke: '#fdba74' };
  if (score >= 22) return { score, level: 'MEDIUM', color: 'text-amber-300', stroke: '#fcd34d' };
  return { score, level: 'LOW', color: 'text-emerald-300', stroke: '#6ee7b7' };
}

function buildPolicySource(entity: AccessEntity, grants: string[]) {
  return JSON.stringify({ entity: entity.id, permissions: grants }, null, 2);
}

export function useInspectorResize() {
  const [width, setWidth] = useState(420);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('conduit-inspector-width'));
    if (Number.isFinite(saved) && saved >= 380 && saved <= 680) setWidth(saved);
  }, []);

  const startResize = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const move = (pointerEvent: globalThis.PointerEvent) => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        setWidth(Math.min(680, Math.max(380, startWidth - (pointerEvent.clientX - startX))));
      });
    };

    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      setWidth((current) => {
        window.localStorage.setItem('conduit-inspector-width', String(current));
        return current;
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }, [width]);

  return { width, startResize };
}
