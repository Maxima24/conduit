'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { Check, Play, X } from 'lucide-react';
import { ENDPOINTS } from './control-data';
import { SectionHeading } from './capability-surface';

gsap.registerPlugin(useGSAP);

type SimulationLaneProps = {
  entityLabel: string;
  grants: string[];
};

const STEPS = [
  { label: 'Request', detail: 'SDK invocation' },
  { label: 'Policy engine', detail: 'Scope resolution' },
  { label: 'Validation', detail: 'Credential check' },
  { label: 'Decision', detail: 'Execution gate' },
];

export function SimulationLane({ entityLabel, grants }: SimulationLaneProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [endpointIndex, setEndpointIndex] = useState(0);
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<'allowed' | 'denied' | null>(null);
  const endpoint = ENDPOINTS[endpointIndex];
  const allowed = grants.includes(endpoint.scope);
  const { contextSafe } = useGSAP({ scope: rootRef });

  const runSimulation = contextSafe(() => {
    setResult(null);
    setStage(-1);
    gsap.killTweensOf('[data-sim-station], [data-sim-line], [data-sim-marker]');
    gsap.set('[data-sim-line]', { scaleX: 0, transformOrigin: 'left center' });
    gsap.set('[data-sim-marker]', { scaleX: 0, transformOrigin: 'left center' });
    gsap.set('[data-sim-station]', { backgroundColor: 'rgba(255,255,255,0)' });

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => setResult(allowed ? 'allowed' : 'denied'),
    });

    STEPS.forEach((_, index) => {
      timeline
        .call(() => setStage(index))
        .to(
          `[data-sim-station="${index}"]`,
          { backgroundColor: 'rgba(0,255,148,.035)', duration: 0.16 },
        )
        .to(
          `[data-sim-marker="${index}"]`,
          { scaleX: 1, duration: 0.28, ease: 'power3.out' },
          '<',
        );

      if (index < STEPS.length - 1) {
        timeline.to(
          `[data-sim-line="${index}"]`,
          { scaleX: 1, duration: 0.3, ease: 'power2.inOut' },
          '-=0.04',
        );
      }
    });
  });

  return (
    <section ref={rootRef} className="control-section pb-10">
      <SectionHeading
        index="04"
        label="Live simulation"
        title="What can this key actually do?"
        detail={entityLabel}
      />

      <div className="simulation-machine">
        <div className="simulation-machine-rail">
          <span>POLICY EXECUTION TRACE / DRY RUN</span>
          <span className="text-[#00ff94]/62">NO REQUEST DISPATCHED</span>
        </div>

        <div className="simulation-control-grid">
          <label className="simulation-control-cell is-target">
            <span>Request target</span>
            <select
              value={endpointIndex}
              onChange={(event) => {
                setEndpointIndex(Number(event.target.value));
                setResult(null);
                setStage(-1);
              }}
            >
              {ENDPOINTS.map((item, index) => (
                <option key={`${item.method}-${item.path}`} value={index}>
                  {item.method} {item.path}
                </option>
              ))}
            </select>
          </label>

          <SimulationDatum label="Required scope" value={endpoint.scope} />
          <SimulationDatum
            label="Projected decision"
            value={allowed ? 'ADMIT' : 'DENY'}
            accent={allowed}
          />

          <button type="button" onClick={runSimulation} className="simulation-run-command">
            <Play className="h-3.5 w-3.5 fill-current" />
            Execute trace
          </button>
        </div>

        <div className="access-scroll overflow-x-auto">
          <div className="simulation-trace">
            {STEPS.map((item, index) => {
              const active = stage >= index;
              const isDecision = index === STEPS.length - 1;

              return (
                <div key={item.label} className="flex shrink-0 items-stretch">
                  <div
                    data-sim-station={index}
                    className={`simulation-station ${active ? 'is-active' : ''}`}
                  >
                    <span
                      data-sim-marker={index}
                      className="simulation-station-marker"
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex items-start justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/22">
                        S-{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`simulation-state ${active ? 'is-active' : ''}`}>
                        {isDecision && result ? result : active ? 'verified' : 'standby'}
                      </span>
                    </div>
                    <span className="simulation-station-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="relative z-10 mt-auto">
                      <h3>{item.label}</h3>
                      <p>{item.detail}</p>
                    </div>
                    {isDecision && result ? (
                      <span className={`simulation-verdict-icon ${result}`}>
                        {result === 'allowed'
                          ? <Check className="h-4 w-4" />
                          : <X className="h-4 w-4" />}
                      </span>
                    ) : null}
                  </div>

                  {index < STEPS.length - 1 ? (
                    <div className="simulation-trace-link">
                      <span data-sim-line={index} />
                      <small>{String(index + 1).padStart(2, '0')}</small>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`simulation-result ${result ? `is-${result}` : ''}`}
          aria-live="polite"
        >
          <span>Trace result</span>
          <strong>
            {result === 'allowed'
              ? 'REQUEST ADMITTED BY ACTIVE POLICY'
              : result === 'denied'
                ? 'REQUEST DENIED BEFORE EXECUTION'
                : 'AWAITING EXECUTION'}
          </strong>
          <code>{result === 'allowed' ? '200 / ALLOWED' : result === 'denied' ? '403 / DENIED' : '--- / STANDBY'}</code>
        </div>
      </div>
    </section>
  );
}

function SimulationDatum({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="simulation-control-cell">
      <span>{label}</span>
      <strong className={accent ? 'text-[#00ff94]/72' : ''}>{value}</strong>
    </div>
  );
}
