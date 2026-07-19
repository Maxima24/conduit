'use client';

import { useState } from 'react';
import { MATRIX_ACTIONS, MATRIX_ROWS } from './control-data';
import { SectionHeading } from './capability-surface';

type CapabilityMatrixProps = {
  grants: string[];
  selectedScope: string;
  onSelectScope: (scopeId: string) => void;
  onToggle: (scopeId: string) => void;
};

export function CapabilityMatrix(props: CapabilityMatrixProps) {
  const { grants, selectedScope, onSelectScope, onToggle } = props;
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  return (
    <section className="control-section">
      <SectionHeading
        index="03"
        label="Capability matrix"
        title="Grant actions at infrastructure scale."
        detail={`${grants.length} effective permissions`}
      />

      <div className="connected-surface access-scroll overflow-x-auto bg-black/20">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[180px_repeat(6,minmax(76px,1fr))] border-b border-white/[0.08] bg-[#0a0a0a]">
            <div className="px-4 py-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/22">Capability / action</div>
            {MATRIX_ACTIONS.map((action) => (
              <div
                key={action}
                onMouseEnter={() => setHoveredColumn(action)}
                onMouseLeave={() => setHoveredColumn(null)}
                className={`border-l border-white/[0.06] px-2 py-3 text-center font-mono text-[8px] uppercase tracking-[0.16em] transition ${hoveredColumn === action ? 'bg-white/[0.035] text-white/65' : 'text-white/25'}`}
              >
                {action}
              </div>
            ))}
          </div>

          {MATRIX_ROWS.map((row, rowIndex) => (
            <div
              key={row.id}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              className={`grid grid-cols-[180px_repeat(6,minmax(76px,1fr))] border-b border-white/[0.055] transition last:border-b-0 ${hoveredRow === row.id ? 'bg-white/[0.026]' : ''}`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-[8px] text-white/18">{String(rowIndex + 1).padStart(2, '0')}</span>
                <span className="text-xs font-medium text-white/58">{row.label}</span>
              </div>

              {MATRIX_ACTIONS.map((action) => {
                const scopeId = row.actions[action];
                const granted = scopeId ? grants.includes(scopeId) : false;
                const selected = scopeId === selectedScope;
                const highlighted = hoveredColumn === action || hoveredRow === row.id;

                return (
                  <div
                    key={action}
                    onMouseEnter={() => setHoveredColumn(action)}
                    onMouseLeave={() => setHoveredColumn(null)}
                    className={`grid min-h-12 place-items-center border-l border-white/[0.055] transition ${highlighted ? 'bg-white/[0.018]' : ''}`}
                  >
                    {scopeId ? (
                      <button
                        type="button"
                        aria-label={`${granted ? 'Revoke' : 'Grant'} ${scopeId}`}
                        aria-pressed={granted}
                        onClick={() => {
                          onSelectScope(scopeId);
                          onToggle(scopeId);
                        }}
                        className={`matrix-switch relative h-8 w-8 border transition duration-300 ${granted ? 'is-active border-emerald-400/55 bg-emerald-400/12' : 'border-white/10 bg-white/[0.018] hover:border-white/28'} ${selected ? 'ring-1 ring-white/40 ring-offset-2 ring-offset-[#090909]' : ''}`}
                      >
                        <span className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 transition duration-300 ${granted ? 'rotate-45 bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.65)]' : 'bg-white/12'}`} />
                      </button>
                    ) : (
                      <span className="h-px w-3 bg-white/[0.07]" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
