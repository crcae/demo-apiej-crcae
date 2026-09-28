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

/** In-flow neumorphic tour banner — pushes content down, never overlaps. */
export function TourDock({
  step, total, title, text, actions, canPrev, isLast, onPrev, onNext, onClose,
}: Props): React.JSX.Element {
  return (
    <div className="relative z-[90] mx-auto mb-6 w-full max-w-4xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff] transition-all duration-300">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0F172A] text-sm font-black text-white shadow-sm">
          <Presentation size={16} />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Tour guiado · Paso {step} de {total}: <span className="text-[#0F172A]">{title}</span>
          </p>
          <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#1E293B]">{text}</p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E2E8F0] shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]">
            <div
              className="h-full rounded-full bg-[#0F172A] transition-all duration-500 ease-out"
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
              className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition-all duration-200 ${
                a.gold === true
                  ? 'bg-[#0F172A] text-white shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff] hover:shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]'
                  : 'bg-[#E2E8F0] text-[#0F172A] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]'
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
            className="rounded-full bg-[#E2E8F0] p-2 text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] transition disabled:opacity-30"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={onNext}
            title={isLast ? 'Finalizar tour' : 'Siguiente (auto-ejecuta el paso)'}
            className="flex items-center gap-1 rounded-full bg-[#0F172A] px-3.5 py-2 text-xs font-extrabold text-white shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff] transition hover:shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]"
          >
            {isLast ? 'Finalizar Tour' : 'Siguiente'} {!isLast && <ArrowRight size={13} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar tour"
            className="rounded-full bg-[#E2E8F0] p-2 text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
