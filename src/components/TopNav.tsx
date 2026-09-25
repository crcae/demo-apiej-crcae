import { useState } from 'react';
import { Check, ChevronDown, FileDown, Map, Presentation, ShieldCheck, Stamp } from 'lucide-react';
import { PERSONAS, PERSONA_SHORT, PERSONA_WHY } from '../store/personas.js';
import type { Currency } from '../features/dashboard/Dashboard.js';
import type { DemoPersonaKey } from '../types/domain.js';

export type TourStep = 1 | 2 | 3;

export interface TopNavItem {
  key: string;
  label: string;
  count?: number;
}

interface Props {
  persona: DemoPersonaKey;
  onPersona: (k: DemoPersonaKey) => void;
  items: TopNavItem[];
  activeView: string;
  onView: (key: string) => void;
  visibleCounts: string;
  currency: Currency;
  onCurrency: (c: Currency) => void;
  onExport: () => void;
  tourOpen: boolean;
  onToggleTour: () => void;
  onTourStep: (s: TourStep) => void;
  tourDone: TourStep | null;
}

const TOUR_STEPS: Array<{ n: TourStep; label: string; hint: string; icon: typeof Map }> = [
  { n: 1, label: 'Resumen de Mercado Q1/Q2', hint: 'Enfoca el Dashboard: KPIs y desglose por corredor', icon: Map },
  { n: 2, label: 'Prueba Aislamiento Multi-Tenant', hint: 'Cambia a Dev Alpha y mira el filtrado instantáneo', icon: ShieldCheck },
  { n: 3, label: 'Aprueba Nave y Recalcula', hint: 'Inbox de Validación: aprueba en 1 clic, Q2 se recalcula', icon: Stamp },
];

export function TopNav({
  persona, onPersona, items, activeView, onView, visibleCounts,
  currency, onCurrency, onExport, tourOpen, onToggleTour, onTourStep, tourDone,
}: Props): React.JSX.Element {
  const [personaOpen, setPersonaOpen] = useState(false);
  const current = PERSONAS.find((p) => p.key === persona) ?? PERSONAS[0];

  function pick(k: DemoPersonaKey): void {
    onPersona(k);
    setPersonaOpen(false);
  }

  return (
    <header className="px-1 pt-1">
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full border border-slate-200/70 bg-white/85 py-2 pl-4 pr-2 shadow-sm backdrop-blur-md">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onView(items[0]?.key ?? '')}
          className="flex items-center gap-2.5"
          title="APIEJ · Plataforma de Inteligencia de Mercado"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F172A] text-sm font-black text-[#FACC15] shadow-sm">
            A
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-extrabold leading-tight text-[#0F172A]">APIEJ</span>
            <span className="block text-[10px] font-bold text-slate-400">Mesa Directiva / Q2 2026</span>
          </span>
        </button>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 md:flex">
          {items.map((it) => {
            const active = it.key === activeView;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onView(it.key)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  active ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-[#0F172A] hover:shadow-sm'
                }`}
              >
                {it.label}
                {it.count !== undefined && it.count > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-[#FACC15] text-slate-900' : 'bg-brand-orange/15 text-brand-orange'}`}>
                    {it.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Tour */}
          <button
            type="button"
            onClick={onToggleTour}
            title="Guía interactiva de 3 pasos para la presentación"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all duration-200 ${
              tourOpen
                ? 'bg-[#0F172A] text-[#FACC15]'
                : 'bg-[#FACC15] text-slate-900 shadow-[0_0_18px_rgba(250,204,21,0.45)] hover:shadow-[0_0_26px_rgba(250,204,21,0.65)]'
            }`}
          >
            <Presentation size={13} /> Tour Guiado
          </button>

          {/* Currency */}
          <div
            className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 sm:flex"
            title="Precios en dólares o pesos (tipo de cambio Banxico del periodo)"
          >
            {(['USD', 'MXN'] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCurrency(c)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${currency === c ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            type="button"
            onClick={onExport}
            title="Vista previa del Reporte Trimestral oficial + descarga PDF"
            className="hidden items-center gap-1.5 rounded-full bg-[#0F172A] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#1E293B] sm:flex"
          >
            <FileDown size={13} /> <span className="hidden lg:inline">Exportar PDF</span><span className="lg:hidden">PDF</span>
          </button>

          {/* Persona dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPersonaOpen((o) => !o)}
              title={PERSONA_WHY[persona]}
              aria-haspopup="menu"
              aria-expanded={personaOpen}
              className="flex items-center gap-1.5 rounded-full bg-slate-100/80 py-1.5 pl-2.5 pr-2 text-xs font-bold text-[#0F172A] ring-1 ring-transparent transition-all duration-200 hover:bg-slate-100 hover:ring-slate-200"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${current.accent}`} />
              {PERSONA_SHORT[persona]}
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${personaOpen ? 'rotate-180' : ''}`} />
            </button>
            {personaOpen && (
              <>
                <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-10 cursor-default" onClick={() => setPersonaOpen(false)} />
                <div role="menu" className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-1.5 shadow-xl">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Cambiar persona · los datos se filtran al instante
                  </p>
                  {PERSONAS.map((p) => {
                    const isActive = p.key === persona;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        role="menuitem"
                        onClick={() => pick(p.key)}
                        title={PERSONA_WHY[p.key]}
                        className={`flex w-full items-start gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-150 ${isActive ? 'bg-[#0F172A] text-white' : 'hover:bg-slate-50'}`}
                      >
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${p.accent}`} />
                        <span className="min-w-0">
                          <span className={`flex items-center gap-1.5 text-xs font-extrabold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                            {PERSONA_SHORT[p.key]}
                            {isActive && <Check size={13} className="text-[#FACC15]" />}
                          </span>
                          <span className={`block truncate text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                            {PERSONA_WHY[p.key]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  <p className="px-3 pb-1.5 pt-2 text-[11px] text-slate-400">Visible ahora: {visibleCounts}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tour popover */}
        {tourOpen && (
          <div className="absolute right-2 top-full z-20 mt-2 w-[22rem] rounded-3xl border border-amber-200/70 bg-white/95 p-2 shadow-xl backdrop-blur-md">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
              Tour guiado · 3 pasos
            </p>
            {TOUR_STEPS.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => onTourStep(s.n)}
                title={s.hint}
                className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-150 ${
                  tourDone === s.n ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-amber-50'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tourDone === s.n ? 'bg-brand-emerald text-white' : 'bg-[#FACC15] text-slate-900'}`}>
                  {tourDone === s.n ? <Check size={14} /> : <s.icon size={14} />}
                </span>
                <span>
                  <span className="block text-xs font-extrabold text-slate-800">{s.label}</span>
                  <span className="block text-[11px] text-slate-400">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
