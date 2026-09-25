import { PERSONAS } from '../store/personas.js';
import type { DemoPersonaKey } from '../types/domain.js';

interface Props {
  active: DemoPersonaKey;
  onSwitch: (key: DemoPersonaKey) => void;
  pendingCount: number;
}

export function DemoRoleBar({ active, onSwitch, pendingCount }: Props): React.JSX.Element {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0B192C] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5">
        <span className="mr-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
          Demo
        </span>
        <span className="mr-2 hidden text-xs text-slate-300 sm:inline">Role switcher · el aislamiento se aplica en backend</span>
        <div className="flex flex-wrap gap-1.5">
          {PERSONAS.map((p) => {
            const isActive = p.key === active;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onSwitch(p.key)}
                title={p.description}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isActive ? 'bg-white text-[#0B192C] shadow' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? p.accent : 'bg-current opacity-60'}`} />
                {p.label}
                {p.key === 'STAFF' && pendingCount > 0 && (
                  <span className="rounded-full bg-brand-orange px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
