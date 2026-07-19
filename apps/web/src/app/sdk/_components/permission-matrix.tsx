'use client';

import { Check, KeyRound, Plus, Users, X } from 'lucide-react';
import { ALL_SCOPES, getScope, type AccessEntity } from './access-data';
import { ColumnLabel } from './scope-tree';

type PermissionMatrixProps = {
  selectedScope: string;
  focusedEntity: string;
  entities: AccessEntity[];
  grants: Record<string, string[]>;
  onSelectScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onToggle: (scopeId: string, entityId: string) => void;
  onBulk: (action: 'grant' | 'revoke' | 'copy') => void;
  onAddTeam: () => void;
};

const RISK_STYLES = {
  low: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300',
  medium: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-300',
  high: 'border-red-500/25 bg-red-500/[0.08] text-red-300',
  critical: 'risk-critical border-red-500/45 bg-red-500/[0.1] text-red-300',
};

export function PermissionMatrix(props: PermissionMatrixProps) {
  const { selectedScope, focusedEntity, entities, grants, onSelectScope, onFocusEntity, onToggle, onBulk, onAddTeam } = props;
  const selected = getScope(selectedScope);

  return (
    <section className="access-column min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
      <ColumnLabel index="02" title="Permission matrix" detail="Edit surface" />

      <div className="border-b border-white/10 bg-white/[0.018] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">Selected scope</p>
            <h1 className="mt-2 break-all font-mono text-xl font-semibold text-white sm:text-2xl">{selected.label}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">{selected.description}</p>
          </div>
          <span className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] ${RISK_STYLES[selected.risk]}`}>
            {selected.risk} risk
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Unlocks</span>
          {selected.grants.map((grant) => (
            <span key={grant} className="border border-emerald-500/15 bg-emerald-500/[0.055] px-2 py-1 font-mono text-[9px] text-emerald-200/65">
              {grant}
            </span>
          ))}
        </div>
      </div>

      <div className="access-scroll min-h-[480px] flex-1 overflow-auto">
        <table className="w-full min-w-[750px] border-collapse">
          <thead className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl">
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-20 w-[190px] min-w-[190px] border-r border-white/10 bg-[#0a0a0a] px-4 py-3 text-left font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">
                Scope / entity
              </th>
              {entities.map((entity) => {
                const focused = focusedEntity === entity.id;
                const Icon = entity.type === 'team' ? Users : KeyRound;
                return (
                  <th key={entity.id} className={`min-w-[98px] border-r border-white/[0.06] px-2 py-2 font-normal last:border-r-0 ${focused ? 'bg-white/[0.045]' : ''}`}>
                    <button type="button" onClick={() => onFocusEntity(entity.id)} className={`mx-auto flex min-w-0 flex-col items-center gap-1.5 px-2 py-1 transition ${focused ? 'text-white' : 'text-white/35 hover:text-white/70'}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="max-w-[86px] truncate font-mono text-[9px] uppercase tracking-[0.13em]">{entity.label}</span>
                    </button>
                  </th>
                );
              })}
              <th className="min-w-[86px] px-2 py-2">
                <button type="button" onClick={onAddTeam} className="mx-auto flex items-center gap-1.5 border border-dashed border-white/15 px-2 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/35 transition hover:border-white/35 hover:text-white">
                  <Plus className="h-3 w-3" /> Team
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {ALL_SCOPES.map((scope) => {
              const active = selectedScope === scope.id;
              return (
                <tr key={scope.id} className={`group/row border-b border-white/[0.045] transition hover:bg-white/[0.025] ${active ? 'bg-white/[0.035]' : ''}`}>
                  <th className={`sticky left-0 z-[5] border-r border-white/10 px-4 py-2.5 text-left font-normal transition ${active ? 'bg-[#141414]' : 'bg-[#0a0a0a] group-hover/row:bg-[#0d0d0d]'}`}>
                    <button type="button" onClick={() => onSelectScope(scope.id)} className={`w-full truncate text-left font-mono text-[10px] ${active ? 'text-white' : 'text-white/50 hover:text-white/85'}`}>
                      {scope.label}
                    </button>
                  </th>
                  {entities.map((entity) => {
                    const granted = grants[entity.id]?.includes(scope.id) ?? false;
                    const focused = focusedEntity === entity.id;
                    return (
                      <td key={entity.id} className={`border-r border-white/[0.045] p-2 text-center last:border-r-0 ${focused ? 'bg-white/[0.018]' : ''}`}>
                        <button
                          type="button"
                          aria-label={`${granted ? 'Revoke' : 'Grant'} ${scope.label} for ${entity.label}`}
                          aria-pressed={granted}
                          onClick={() => onToggle(scope.id, entity.id)}
                          className={`permission-cell mx-auto grid h-8 w-8 place-items-center border transition ${granted ? 'is-granted border-emerald-500/45 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.025] text-white/18 hover:border-white/25 hover:text-white/50'}`}
                        >
                          {granted ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <X className="h-3.5 w-3.5" strokeWidth={1.4} />}
                        </button>
                      </td>
                    );
                  })}
                  <td />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0a0a0a] px-4 py-3">
        <span className="mr-auto font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Selected row actions</span>
        {(['grant', 'revoke', 'copy'] as const).map((action) => (
          <button key={action} type="button" onClick={() => onBulk(action)} className="border border-white/12 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 transition hover:border-white/35 hover:bg-white/[0.04] hover:text-white">
            {action === 'copy' ? 'Copy from Alpha' : `${action} all`}
          </button>
        ))}
      </div>
    </section>
  );
}

