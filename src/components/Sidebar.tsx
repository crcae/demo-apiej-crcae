import { useState } from 'react';
import { Check, ChevronsUpDown, FilePlus2, LayoutDashboard, Map, ScrollText, Stamp, type LucideIcon } from 'lucide-react';
import { PERSONAS, PERSONA_SHORT, PERSONA_WHY } from '../store/personas.js';
import type { DemoPersonaKey } from '../types/domain.js';

export interface SideNavItem {
  key: string;
  label: string;
  count?: number;
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  mapa: Map,
  captura: FilePlus2,
  validacion: Stamp,
  auditoria: ScrollText,
};

interface Props {
  items: SideNavItem[];
  activeView: string;
  onView: (key: string) => void;
  persona: DemoPersonaKey;
  onPersona: (k: DemoPersonaKey) => void;
  orgName: string;
  visibleCounts: string;
}

export function Sidebar({ items, activeView, onView, persona, onPersona, orgName, visibleCounts }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const current = PERSONAS.find((p) => p.key === persona) ?? PERSONAS[0];

  function pick(k: DemoPersonaKey): void {
    onPersona(k);
    setOpen(false);
  }

  return (
    <aside className="sticky top-6 z-[80] hidden min-h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between rounded-[2.2rem] border border-white/60 bg-[#EBF0F5] p-5 shadow-[10px_10px_20px_#c8d0e0,-10px_-10px_20px_#ffffff] md:flex">
      <div>
        <div className="flex items-center gap-2.5 px-1" title="APIEJ · Plataforma de Inteligencia de Mercado">
          <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain" />
          <span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
              <i className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Jalisco Intelligence
            </span>
          </span>
        </div>
        <nav className="mt-6 space-y-2">
          {items.map((it) => {
            const active = it.key === activeView;
            const Icon = ICONS[it.key] ?? LayoutDashboard;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onView(it.key)}
                aria-current={active}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-sm transition-all duration-200 ${
                  active
                    ? 'bg-[#E2E8F0] font-bold text-[#0F172A] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]'
                    : 'font-semibold text-slate-600 hover:bg-[#E4E9F1] hover:text-[#0F172A]'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#0F172A]' : 'text-slate-500'} />
                {it.label}
                {it.count !== undefined && it.count > 0 && (
                  <span className={`ml-auto rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-[#0F172A] text-white' : 'bg-[#00a2ff]/15 text-[#0284c7]'}`}>
                    {it.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-6 space-y-2">
        <div className="rounded-2xl bg-[#E2E8F0] p-3.5 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#65A30D]">
            <i className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#b3d700]" /> Sistema en vivo
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-700">{orgName}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-600" title="Filtrado por tenant y visibilidad en backend">{visibleCounts}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title={PERSONA_WHY[persona]}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex w-full items-center gap-2 rounded-2xl bg-[#E2E8F0] px-3.5 py-3 text-left shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] transition-all duration-200"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${current.accent}`} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-extrabold text-[#0F172A]">{PERSONA_SHORT[persona]}</span>
              <span className="block text-[10px] font-semibold text-slate-600">Cambiar persona</span>
            </span>
            <ChevronsUpDown size={14} className="ml-auto shrink-0 text-slate-600" />
          </button>
          {open && (
            <>
              <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-[90] cursor-default" onClick={() => setOpen(false)} />
              <div role="menu" className="absolute bottom-full z-[100] mb-2 w-full overflow-hidden rounded-2xl border border-white/60 bg-[#EBF0F5] p-1.5 shadow-[10px_10px_20px_#c8d0e0,-10px_-10px_20px_#ffffff]">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                  Persona · filtrado instantáneo
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
                      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-[#E2E8F0] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]'
                          : 'hover:bg-[#E4E9F1]'
                      }`}
                    >
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${p.accent}`} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#0F172A]">
                          {PERSONA_SHORT[p.key]}
                          {isActive && <Check size={13} className="text-emerald-600" />}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-600">
                          {PERSONA_WHY[p.key]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
