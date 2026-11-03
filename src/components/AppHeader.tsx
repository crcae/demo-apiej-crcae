import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Check, ChevronsUpDown, FilePlus2, FileText, LayoutDashboard,
  Map, Menu, ScrollText, Stamp, X, type LucideIcon,
} from 'lucide-react';
import { PERSONAS, PERSONA_SHORT, PERSONA_WHY } from '../store/personas.js';
import type { DemoPersonaKey } from '../types/domain.js';

export interface HeaderNavItem {
  key: string;
  label: string;
  count?: number;
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  mapa: Map,
  inventario: Building2,
  captura: FilePlus2,
  validacion: Stamp,
  reportes: FileText,
  auditoria: ScrollText,
};

interface Props {
  items: HeaderNavItem[];
  activeView: string;
  onView: (key: string) => void;
  persona: DemoPersonaKey;
  onPersona: (k: DemoPersonaKey) => void;
  orgName: string;
  visibleCounts: string;
}

export function AppHeader({
  items, activeView, onView, persona, onPersona, orgName, visibleCounts,
}: Props): React.JSX.Element {
  const navigate = useNavigate();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = PERSONAS.find((p) => p.key === persona) ?? PERSONAS[0];

  function pickPersona(k: DemoPersonaKey): void {
    onPersona(k);
    setPersonaOpen(false);
  }

  function pickView(key: string): void {
    onView(key);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-[90] border-b border-white/10 bg-[#0E1A3D] text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Ir al inicio"
          className="flex shrink-0 items-center gap-2.5 rounded-lg transition hover:opacity-90"
        >
          <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain brightness-0 invert" />
          <span className="hidden border-l border-white/25 pl-2.5 text-[10px] font-bold uppercase tracking-wider text-white/70 sm:block">
            Jalisco Intelligence
          </span>
        </button>

        <nav className="ml-2 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
          {items.map((it) => {
            const active = it.key === activeView;
            const Icon = ICONS[it.key] ?? LayoutDashboard;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => pickView(it.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-[#4A6CFF] text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {it.label}
                {it.count !== undefined && it.count > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/25' : 'bg-[#FF7A00]/90 text-white'}`}>
                    {it.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right xl:block">
            <p className="text-[10px] font-bold text-emerald-300">● En vivo</p>
            <p className="max-w-[160px] truncate text-[10px] font-medium text-white/60" title={visibleCounts}>
              {orgName} · {visibleCounts}
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPersonaOpen((o) => !o)}
              title={PERSONA_WHY[persona]}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${current.accent}`} />
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-xs font-extrabold">{PERSONA_SHORT[persona]}</span>
                <span className="block text-[10px] font-medium text-white/55">Persona demo</span>
              </span>
              <ChevronsUpDown size={14} className="shrink-0 text-white/50" />
            </button>
            {personaOpen && (
              <>
                <button type="button" aria-label="Cerrar" className="fixed inset-0 z-[95]" onClick={() => setPersonaOpen(false)} />
                <div className="absolute right-0 z-[100] mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-2xl">
                  {PERSONAS.map((p) => {
                    const isActive = p.key === persona;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => pickPersona(p.key)}
                        className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${p.accent}`} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                            {PERSONA_SHORT[p.key]}
                            {isActive && <Check size={13} className="text-emerald-600" />}
                          </span>
                          <span className="block text-[11px] font-medium text-slate-500">{PERSONA_WHY[p.key]}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 bg-[#0E1A3D] px-3 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {items.map((it) => {
              const active = it.key === activeView;
              const Icon = ICONS[it.key] ?? LayoutDashboard;
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => pickView(it.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold ${
                    active ? 'bg-[#4A6CFF] text-white' : 'bg-white/10 text-white/80'
                  }`}
                >
                  <Icon size={13} />
                  {it.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
