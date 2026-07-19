'use client';

import { useState } from 'react';
import { ChevronDown, LockKeyhole, UnlockKeyhole } from 'lucide-react';
import { SCOPE_GROUPS, type AccessEntity } from './access-data';

type ScopeTreeProps = {
  selectedScope: string;
  entities: AccessEntity[];
  grants: Record<string, string[]>;
  onSelect: (scopeId: string) => void;
};

export function ScopeTree({ selectedScope, entities, grants, onSelect }: ScopeTreeProps) {
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setCollapsed((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  };

  return (
    <aside className="access-column min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
      <ColumnLabel index="01" title="Scope tree" detail="18 permissions" />
      <div className="access-scroll max-h-[360px] overflow-y-auto xl:max-h-none xl:flex-1">
        {SCOPE_GROUPS.map((group) => {
          const isCollapsed = collapsed.includes(group.id);
          return (
            <div key={group.id} className="border-b border-white/[0.06] last:border-0">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center gap-2 border-l-2 border-white/15 px-3 py-3 text-left text-white/40 transition hover:bg-white/[0.025] hover:text-white/70"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.28em]">{group.label}</span>
                <span className="ml-auto font-mono text-[9px] text-white/20">{String(group.scopes.length).padStart(2, '0')}</span>
              </button>

              <div className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="min-h-0">
                  {group.scopes.map((scope) => {
                    const grantedCount = entities.filter((entity) => grants[entity.id]?.includes(scope.id)).length;
                    const state = grantedCount === 0 ? 'denied' : grantedCount === entities.length ? 'granted' : 'partial';
                    const active = selectedScope === scope.id;
                    return (
                      <button
                        type="button"
                        key={scope.id}
                        onClick={() => onSelect(scope.id)}
                        className={`group/scope flex w-full items-center gap-2 border-b border-l-2 border-b-white/[0.04] px-3 py-2.5 text-left transition ${active ? 'border-l-white bg-white/[0.055] text-white' : 'border-l-transparent text-white/55 hover:bg-white/[0.03] hover:text-white/90'}`}
                      >
                        <span
                          className={`scope-state-dot h-1.5 w-1.5 shrink-0 ${state === 'granted' ? 'bg-emerald-400' : state === 'partial' ? 'bg-amber-400' : 'bg-white/20'}`}
                        />
                        <span className="min-w-0 flex-1 truncate font-mono text-[10px]">{scope.label}</span>
                        {state === 'denied' ? (
                          <LockKeyhole className="h-3.5 w-3.5 text-white/20 group-hover/scope:text-white/45" />
                        ) : (
                          <UnlockKeyhole className="h-3.5 w-3.5 text-white/30 group-hover/scope:text-emerald-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function ColumnLabel({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-white/10 px-3">
      <span className="font-mono text-[9px] text-white/20">{index}</span>
      <span className="ml-3 font-mono text-[9px] font-medium uppercase tracking-[0.28em] text-white/40">{title}</span>
      <span className="ml-auto font-mono text-[9px] text-white/20">{detail}</span>
    </div>
  );
}

