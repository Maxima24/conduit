'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ArrowRight, Check, Play, ShieldCheck, X } from 'lucide-react';
import { ENDPOINTS } from './control-data';
import { SectionHeading } from './capability-surface';

type SimulationLaneProps = {
  entityLabel: string;
  grants: string[];
};

const STEPS = ['Request', 'Permission engine', 'Validation', 'Decision'];

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
    setStage(0);
    gsap.killTweensOf('[data-sim-node]');
    gsap.set('[data-sim-node]', { clearProps: 'all' });

    const timeline = gsap.timeline({
      onComplete: () => setResult(allowed ? 'allowed' : 'denied'),
    });

    STEPS.forEach((_, index) => {
      timeline
        .call(() => setStage(index))
        .fromTo(
          `[data-sim-node="${index}"]`,
          { scale: 0.92, borderColor: 'rgba(255,255,255,.1)' },
          { scale: 1.035, borderColor: 'rgba(110,231,183,.55)', duration: 0.28, ease: 'power2.out' },
        )
        .to(`[data-sim-node="${index}"]`, { scale: 1, duration: 0.22, ease: 'power2.inOut' });
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

      <div className="connected-surface bg-black/25 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3 border-b border-white/[0.07] pb-4">
          <label className="min-w-[240px] flex-1">
            <span className="block font-mono text-[8px] uppercase tracking-[0.2em] text-white/24">Request target</span>
            <select
              value={endpointIndex}
              onChange={(event) => {
                setEndpointIndex(Number(event.target.value));
                setResult(null);
                setStage(-1);
              }}
              className="mt-2 h-10 w-full border border-white/10 bg-[#0b0b0b] px-3 font-mono text-[10px] text-white/65 outline-none transition focus:border-white/30"
            >
              {ENDPOINTS.map((item, index) => (
                <option key={`${item.method}-${item.path}`} value={index}>{item.method} {item.path}</option>
              ))}
            </select>
          </label>

          <div className="min-w-[180px] flex-1">
            <span className="block font-mono text-[8px] uppercase tracking-[0.2em] text-white/24">Required scope</span>
            <div className="mt-2 flex h-10 items-center border border-white/10 bg-white/[0.018] px-3 font-mono text-[10px] text-white/48">{endpoint.scope}</div>
          </div>

          <button
            type="button"
            onClick={runSimulation}
            className="flex h-10 items-center gap-2 border border-white bg-white px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-emerald-300"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Run simulation
          </button>
        </div>

        <div className="access-scroll mt-5 flex items-center overflow-x-auto pb-2">
          {STEPS.map((item, index) => {
            const active = stage >= index;
            const isDecision = index === STEPS.length - 1;
            return (
              <div key={item} className="flex shrink-0 items-center">
                <div
                  data-sim-node={index}
                  className={`relative flex h-[92px] w-[150px] flex-col justify-between border p-3 transition-colors ${active ? 'border-emerald-400/35 bg-emerald-400/[0.045]' : 'border-white/[0.08] bg-[#0b0b0b]'}`}
                >
                  <span className="font-mono text-[8px] text-white/20">0{index + 1}</span>
                  <div>
                    <p className="text-xs font-medium text-white/65">{item}</p>
                    <p className={`mt-1 font-mono text-[8px] uppercase tracking-[0.12em] ${active ? 'text-emerald-300/65' : 'text-white/18'}`}>
                      {isDecision && result ? result : active ? 'processing' : 'standby'}
                    </p>
                  </div>
                  {isDecision && result ? (
                    result === 'allowed' ? <Check className="absolute right-3 top-3 h-4 w-4 text-emerald-300" /> : <X className="absolute right-3 top-3 h-4 w-4 text-red-300" />
                  ) : index === 1 ? <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-white/18" /> : null}
                </div>
                {index < STEPS.length - 1 ? (
                  <div className={`relative h-px w-12 bg-white/10 ${stage > index ? 'simulation-edge-active' : ''}`}>
                    {stage > index ? <span className="simulation-particle absolute -top-1 h-2 w-2 bg-emerald-300" /> : null}
                    <ArrowRight className="absolute -right-1.5 -top-1.5 h-3 w-3 text-white/16" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {result ? (
          <div className={`mt-4 flex items-center justify-between border px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.13em] ${result === 'allowed' ? 'border-emerald-400/25 bg-emerald-400/[0.055] text-emerald-200/70' : 'border-red-400/25 bg-red-400/[0.055] text-red-200/70'}`}>
            <span>{result === 'allowed' ? 'Request admitted by active policy' : 'Request denied before execution'}</span>
            <span>{result === 'allowed' ? '200 / allowed' : '403 / denied'}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
