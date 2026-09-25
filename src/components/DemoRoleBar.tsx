import { PERSONAS } from '../store/personas.js';
import type { DemoPersonaKey } from '../types/domain.js';

interface Props {
  active: DemoPersonaKey;
  onSwitch: (key: DemoPersonaKey) => void;
  pendingCount: number;
  visibleCounts: string;
}

const WHY: Record<DemoPersonaKey, string> = {
  STAFF: 'Ves TODO: borradores, pendientes, razones sociales reales, notas internas y auditoría.',
  ALPHA: 'Ves SOLO propiedades de Developer Alpha (El Salto, Tlajomulco). Lo de Beta desaparece.',
  BETA: 'Ves SOLO propiedades de Developer Beta (Zapopan, Periférico Sur). Lo de Alpha desaparece.',
  MEMBER: 'Ves SOLO agregados verificados y anonimizados. Sin borradores, sin nombres reales, sin auditoría.',
};

export function DemoRoleBar({ active, onSwitch, pendingCount, visibleCounts }: Props): React.JSX.Element {
  const current = PERSONAS.find((p) => p.key === active) ?? PERSONAS[0];
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0B192C] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
        <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
          Demo
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PERSONAS.map((p) => {
            const isActive = p.key === active;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onSwitch(p.key)}
                title={`${p.description}. ${WHY[p.key]}`}
                aria-pressed={isActive}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive ? 'bg-white text-[#0B192C] shadow' : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:shadow-sm'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isActive && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${p.accent}`} />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? p.accent : 'bg-current opacity-60'}`} />
                </span>
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
        <p className="hidden w-full text-[11px] text-slate-300 lg:block" title={WHY[current.key]}>
          <span className="font-bold text-white">{current.label}:</span> {WHY[current.key]}{' '}
          <span className="text-slate-400">· {visibleCounts}</span>
        </p>
      </div>
    </div>
  );
}
