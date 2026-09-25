import { ArrowLeft, ArrowRight, Presentation, X } from 'lucide-react';

export interface TourAction {
  label: string;
  run: () => void;
  gold?: boolean;
}

interface Props {
  step: number;
  total: number;
  title: string;
  text: string;
  actions: TourAction[];
  canPrev: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/** Top glass banner dock — in-flow under TopNav, never overlaps charts or cards. */
export function TourDock({
  step, total, title, text, actions, canPrev, isLast, onPrev, onNext, onClose,
}: Props): React.JSX.Element {
  return (
    <div className="relative z-[90] mx-auto mb-6 w-full max-w-4xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 text-white shadow-2xl backdrop-blur-md transition-all duration-300">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FACC15] text-sm font-black text-slate-900">
          <Presentation size={16} />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FACC15]">
            Tour guiado · Paso {step} de {total}: {title}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-100">{text}</p>
          <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#FACC15] transition-all duration-500 ease-out"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.run}
              className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition-all duration-200 hover:shadow-lg ${
                a.gold === true
                  ? 'bg-[#FACC15] text-slate-900 shadow-[0_0_18px_rgba(250,204,21,0.35)]'
                  : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20'
              }`}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            title="Paso anterior"
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={onNext}
            title={isLast ? 'Finalizar tour' : 'Siguiente (auto-ejecuta el paso)'}
            className="flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-[#0F172A] transition hover:shadow-lg"
          >
            {isLast ? 'Finalizar Tour' : 'Siguiente'} {!isLast && <ArrowRight size={13} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar tour"
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
