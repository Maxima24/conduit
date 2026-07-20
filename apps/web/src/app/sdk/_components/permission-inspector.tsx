'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { Check, Copy, GripVertical } from 'lucide-react';
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
        .fromTo(
          rootRef.current,
          { clipPath: 'inset(0 0 0 3%)', opacity: 0.9 },
          { clipPath: 'inset(0 0 0 0%)', opacity: 1, duration: 0.5 },
        )
        .from(
          '[data-inspector-section]',
          { x: 6, opacity: 0.84, stagger: 0.06, duration: 0.34 },
          '-=0.26',
        );
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

      const endpointRow = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>('[data-endpoint-scope]') ?? [],
      ).find((row) => row.dataset.endpointScope === lastChanged);
      const endpointStatus = endpointRow?.querySelector<HTMLElement>('[data-endpoint-status]');

      if (endpointRow) {
        gsap.fromTo(
          endpointRow,
          { backgroundColor: 'rgba(0,255,148,.09)' },
          {
            backgroundColor: 'rgba(0,255,148,0)',
            duration: 0.4,
            ease: 'power2.out',
            clearProps: 'backgroundColor',
          },
        );
      }

      if (endpointStatus) {
        const finalOpacity = grants.includes(lastChanged) ? 1 : 0.22;
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
          {
            strokeDashoffset: circumference - (risk.score / 100) * circumference,
            duration: 0.8,
            ease: 'power3.inOut',
          },
        );
      }

      if (scoreLabel) {
        const counter = { value: previousScore };
        gsap.to(counter, {
          value: risk.score,
          duration: 0.8,
          ease: 'power3.inOut',
          onUpdate: () => {
            scoreLabel.textContent = String(Math.round(counter.value));
          },
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
        className="inspector-resize-handle group absolute inset-y-0 -left-3 z-30 hidden w-6 cursor-col-resize xl:flex"
      >
        <span className="inspector-resize-track">
          <GripVertical className="h-3.5 w-3.5" />
          <small>RESIZE</small>
        </span>
      </button>

      <header className="inspector-header">
        <div>
          <p>00 / POLICY MIRROR</p>
          <h2>Effective SDK Surface</h2>
        </div>
        <div className="text-right">
          <strong>{entity.label}</strong>
          <span>POLICY LINKED</span>
        </div>
      </header>

      <div className="access-scroll min-h-0 flex-1 overflow-y-auto">
        <section data-inspector-section className="inspector-section inspector-risk-section">
          <InspectorSectionRail index="01" label="Permission exposure" value={`${grants.length} grants`} />
          <div className="inspector-risk-body">
            <div>
              <p className="inspector-risk-level" style={{ color: risk.color }}>{risk.level}</p>
              <p className="inspector-risk-copy">
                Weighted from replay, mutation, administration, and credential privileges.
              </p>
            </div>
            <RiskDial score={risk.score} color={risk.color} />
          </div>
        </section>

        <section data-inspector-section className="inspector-section">
          <InspectorSectionRail
            index="02"
            label="Endpoint ledger"
            value={`${enabledEndpoints.length}/${ENDPOINTS.length} enabled`}
          />
          <div className="endpoint-ledger">
            {ENDPOINTS.map((endpoint, index) => {
              const enabled = grants.includes(endpoint.scope);
              return (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  data-endpoint-scope={endpoint.scope}
                  className={`endpoint-ledger-row ${enabled ? 'is-enabled' : ''}`}
                >
                  <span className="endpoint-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="endpoint-method">{endpoint.method}</span>
                  <code>{endpoint.path}</code>
                  <span data-endpoint-status className="endpoint-status">
                    {enabled ? 'OPEN' : 'LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section data-inspector-section className="inspector-section">
          <InspectorSectionRail index="03" label="Generated policy" value="TYPESCRIPT" />
          <div className="policy-source-head">
            <span>policy.generated.ts</span>
            <button type="button" onClick={copyPolicy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy source'}
            </button>
          </div>
          <div className="access-scroll policy-source overflow-x-auto">
            <p><span className="policy-keyword">const</span> sdk = <span className="policy-keyword">new</span> ConduitSDK({'{'}</p>
            <p className="pl-4 text-white/40">apiKey,</p>
            <p className="pl-4 text-white/40">permissions: {'{'}</p>
            {SCOPE_GROUPS.map((group) => {
              const active = group.scopes.filter((scope) => grants.includes(scope.id));
              return (
                <div
                  key={group.id}
                  className={`code-scope-line pl-8 ${active.some((scope) => scope.id === lastChanged) ? 'is-changing' : ''}`}
                >
                  <span className={active.length ? 'text-[#00ff94]/58' : 'text-white/14'}>
                    {group.id}: {'{'}
                  </span>
                  {group.scopes.map((scope) => (
                    <p
                      key={scope.id}
                      className={`pl-4 ${grants.includes(scope.id) ? 'text-white/52' : 'text-white/12'}`}
                    >
                      {scope.id.split(':').at(-1)}: {grants.includes(scope.id) ? 'true' : 'false'},
                    </p>
                  ))}
                  <span className={active.length ? 'text-[#00ff94]/58' : 'text-white/14'}>{'},'}</span>
                </div>
              );
            })}
            <p className="pl-4 text-white/28">{'}'}</p>
            <p className="text-white/28">{'});'}</p>
          </div>
        </section>

        <section data-inspector-section className="inspector-section">
          <InspectorSectionRail index="04" label="Policy history" value="LATEST FIRST" />
          <div className="history-ledger">
            {history.slice(0, 7).map((event, index) => (
              <div key={event.id} className={`history-ledger-row is-${event.tone ?? 'neutral'}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{event.action}</strong>
                  <p>{event.detail}</p>
                </div>
                <time>{event.time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function InspectorSectionRail({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div className="inspector-section-rail">
      <span>{index}</span>
      <strong>{label}</strong>
      <small>{value}</small>
    </div>
  );
}

function RiskDial({ score, color }: { score: number; color: string }) {
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="risk-dial">
      <svg viewBox="0 0 82 82" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth="3"
        />
        <circle
          data-risk-arc
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="risk-arc"
        />
      </svg>
      <span data-risk-value>{score}</span>
      <small>RISK</small>
    </div>
  );
}

function calculateRisk(grants: string[]) {
  const score = Math.min(
    100,
    grants.reduce((total, scopeId) => {
      const scope = ALL_SCOPES.find((item) => item.id === scopeId);
      const weight = scope?.risk === 'critical'
        ? 18
        : scope?.risk === 'high'
          ? 11
          : scope?.risk === 'medium'
            ? 6
            : 2;
      return total + weight;
    }, 0),
  );

  if (score >= 70) return { score, level: 'CRITICAL', color: '#fca5a5' };
  if (score >= 45) return { score, level: 'HIGH', color: '#fdba74' };
  if (score >= 22) return { score, level: 'MEDIUM', color: '#fcd34d' };
  return { score, level: 'LOW', color: '#00ff94' };
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
