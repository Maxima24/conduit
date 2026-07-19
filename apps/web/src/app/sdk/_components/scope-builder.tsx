'use client';

import { Building2, Code2, KeyRound, Layers3, ShieldCheck, Unplug, UserRound, Users } from 'lucide-react';
import type { AccessEntity } from './access-data';
import { SectionHeading } from './capability-surface';

type ScopeBuilderProps = {
  entities: AccessEntity[];
  focusedEntity: AccessEntity;
  effectiveCount: number;
  connected: boolean;
  onFocus: (entityId: string) => void;
  onConnectionChange: (connected: boolean) => void;
};

const LEVELS = [
  { id: 'organization', label: 'Organization', value: 'Conduit Inc.', icon: Building2 },
  { id: 'workspace', label: 'Workspace', value: 'Production', icon: Layers3 },
  { id: 'team', label: 'Access entity', value: '', icon: Users },
  { id: 'developer', label: 'Developer', value: 'SDK consumer', icon: UserRound },
  { id: 'key', label: 'Credential', value: '', icon: KeyRound },
  { id: 'permissions', label: 'Permission set', value: '', icon: ShieldCheck },
];

export function ScopeBuilder(props: ScopeBuilderProps) {
  const { entities, focusedEntity, effectiveCount, connected, onFocus, onConnectionChange } = props;
  const keyEntity = focusedEntity.type === 'key'
    ? focusedEntity
    : entities.find((entity) => entity.type === 'key') ?? focusedEntity;

  return (
    <section className="control-section">
      <SectionHeading
        index="02"
        label="Scope builder"
        title="Trace how permission reaches the SDK."
        detail={connected ? 'Path verified' : 'Path interrupted'}
      />

      <div className="connected-surface p-3 sm:p-5">
        <div className="access-scroll flex min-w-0 gap-0 overflow-x-auto pb-2">
          {LEVELS.map((level, index) => {
            const Icon = level.icon;
            const value = level.id === 'team'
              ? focusedEntity.label
              : level.id === 'key'
                ? keyEntity.label
                : level.id === 'permissions'
                  ? `${effectiveCount} grants`
                  : level.value;
            const dimmed = !connected && index > 1;

            return (
              <div key={level.id} className="flex min-w-0 shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (level.id === 'team') onFocus(focusedEntity.type === 'team' ? focusedEntity.id : 'team-alpha');
                    if (level.id === 'key') onFocus(keyEntity.id);
                  }}
                  className={`machine-flow-node group/node relative h-[112px] w-[142px] bg-[#0c0c0c] p-3 text-left transition duration-300 sm:w-[154px] ${dimmed ? 'opacity-25' : 'hover:bg-white/[0.025]'}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${dimmed ? 'text-white/20' : 'text-white/45 group-hover/node:text-emerald-300'}`} strokeWidth={1.5} />
                    <span className="font-mono text-[8px] text-white/18">L{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.18em] text-white/24">{level.label}</p>
                  <p className="mt-1 truncate text-xs font-medium text-white/70">{value}</p>
                  {!dimmed ? <span className="absolute bottom-0 left-0 h-px w-full origin-left bg-emerald-300/35 transition-transform duration-500 group-hover/node:scale-x-100" /> : null}
                </button>

                {index < LEVELS.length - 1 ? (
                  <div className={`relative h-px w-10 shrink-0 bg-white/10 sm:w-12 ${!connected && index >= 1 ? 'opacity-20' : ''}`}>
                    {connected || index === 0 ? <span className="flow-packet absolute -top-1 h-2 w-2 bg-emerald-300" /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
          <span className="mr-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/24">
            <Code2 className="h-3.5 w-3.5" /> Focus entity
          </span>
          {entities.map((entity) => (
            <button
              type="button"
              key={entity.id}
              onClick={() => onFocus(entity.id)}
              className={`border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] transition ${focusedEntity.id === entity.id ? 'border-white/35 bg-white/[0.08] text-white' : 'border-white/[0.08] text-white/28 hover:border-white/25 hover:text-white/65'}`}
            >
              {entity.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onConnectionChange(!connected)}
            className={`ml-auto flex items-center gap-2 border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] transition ${connected ? 'border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200/70 hover:border-red-400/30 hover:text-red-200' : 'border-red-400/30 bg-red-400/[0.07] text-red-200/70 hover:border-emerald-400/35 hover:text-emerald-200'}`}
          >
            <Unplug className="h-3.5 w-3.5" /> {connected ? 'Disconnect path' : 'Restore path'}
          </button>
        </div>
      </div>
    </section>
  );
}
