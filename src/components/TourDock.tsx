import { ArrowLeft, ArrowRight, Presentation, X } from 'lucide-react';

export type TourStep = 1 | 2 | 3 | 4 | 5;

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

/** In-flow tour banner — flat APIEJ shell. */
export function TourDock({
  step, total, title, text, actions, canPrev, isLast, onPrev, onNext, onClose,
}: Props): React.JSX.Element {
  return (
    <div className="relative z-[90] mx-auto mb-6 w-full max-w-4xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-[#4A6CFF]/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E1A3D] text-sm font-black text-white shadow-sm">
          <Presentation size={16} />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Tour guiado · Paso {step} de {total}: <span className="text-[#0E1A3D]">{title}</span>
          </p>
          <p className="mt-0.5 text-[13px] font-medium leading-snug text-slate-700">{text}</p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#4A6CFF] transition-all duration-500 ease-out"
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
              className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition ${
                a.gold === true
                  ? 'bg-[#0E1A3D] text-white hover:bg-[#152552]'
                  : 'bg-slate-100 text-[#0E1A3D] hover:bg-slate-200'
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
            className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 disabled:opacity-30"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={onNext}
            title={isLast ? 'Finalizar tour' : 'Siguiente (auto-ejecuta el paso)'}
            className="flex items-center gap-1 rounded-full bg-[#4A6CFF] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#3b5aef]"
          >
            {isLast ? 'Finalizar Tour' : 'Siguiente'} {!isLast && <ArrowRight size={13} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar tour"
            className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
