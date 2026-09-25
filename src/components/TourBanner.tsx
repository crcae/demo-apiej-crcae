import { Map, Presentation, ShieldCheck, Stamp, X } from 'lucide-react';

export type TourStep = 1 | 2 | 3;

interface Props {
  onStep: (s: TourStep) => void;
  onClose: () => void;
  doneStep: TourStep | null;
}

const STEPS: Array<{ n: TourStep; label: string; icon: typeof Map }> = [
  { n: 1, label: '1. Explora el Mercado Q1/Q2', icon: Map },
  { n: 2, label: '2. Simula Aislamiento Multi-Tenant', icon: ShieldCheck },
  { n: 3, label: '3. Aprueba y Recalcula en Vivo', icon: Stamp },
];

export function TourBanner({ onStep, onClose, doneStep }: Props): React.JSX.Element {
  return (
    <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5">
        <span className="flex items-center gap-1.5 rounded-xl bg-[#0B192C] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
          <Presentation size={13} /> Modo Presentación APIEJ
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => onStep(s.n)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition-all duration-200 hover:shadow-sm ${
                doneStep === s.n
                  ? 'bg-brand-emerald text-white ring-brand-emerald'
                  : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-blue'
              }`}
            >
              <s.icon size={13} /> {s.label}
              {doneStep === s.n && <span>✓</span>}
            </button>
          ))}
        </div>
        <button
          type="button" onClick={onClose}
          className="ml-auto rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Ocultar modo presentación"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
