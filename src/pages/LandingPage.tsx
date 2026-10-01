import { ArrowRight, ArrowUpRight, BarChart3, Building2, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockQ1Kpis } from '../mock/market.mock.js';
import { formatAreaM2, formatPct, formatUsdM2 } from '../utils/formatters.js';

type EntryView = 'dashboard' | 'mapa';

function go(navigate: (to: string, opts?: { state?: { view?: EntryView } }) => void, view?: EntryView): void {
  navigate('/dashboard', view === undefined ? undefined : { state: { view } });
}

const CARDS: Array<{ icon: typeof Map; title: string; desc: string; view: EntryView; accent: string; hover: string }> = [
  { icon: Building2, title: 'Parques y espacios', desc: 'Naves, terrenos y disponibilidad verificada.', view: 'dashboard', accent: 'text-[#ff8d00]', hover: 'group-hover:text-[#ff8d00]' },
  { icon: Map, title: 'Zonas industriales', desc: 'Corredores de Jalisco en mapa interactivo.', view: 'mapa', accent: 'text-[#65A30D]', hover: 'group-hover:text-[#65A30D]' },
  { icon: BarChart3, title: 'Indicadores', desc: 'Vacancia, absorción y rentas Q1–Q2.', view: 'dashboard', accent: 'text-[#00a2ff]', hover: 'group-hover:text-[#00a2ff]' },
];

export function LandingPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#EBF0F5] text-[#0F172A]">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-5 md:px-6">
        <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain" />
        <nav className="ml-6 hidden items-center gap-5 text-sm font-bold text-slate-600 md:flex">
          <button type="button" onClick={() => go(navigate, 'mapa')} className="transition hover:text-[#0F172A]">
            Mercado
          </button>
          <a href="#acerca" className="transition hover:text-[#0F172A]">
            Acerca de APIEJ
          </a>
        </nav>
        <button
          type="button"
          onClick={() => go(navigate)}
          className="ml-auto rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-bold text-white shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff] transition-all duration-200 hover:shadow-[0_0_22px_rgba(0,162,255,0.55)]"
        >
          Ingresar a la Plataforma ↗
        </button>
      </header>

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-10 pt-6 md:grid-cols-2 md:px-6 md:pt-10">
        <div>
          <span className="inline-block rounded-full bg-[#E2E8F0] px-4 py-1.5 text-[11px] font-extrabold tracking-[0.15em] text-[#ff8d00] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
            — INTELIGENCIA INDUSTRIAL · JALISCO
          </span>
          <h1 className="font-display mt-4 text-5xl font-extrabold leading-tight text-[#0F172A]">
            El mercado industrial de Jalisco, en un solo lugar.
          </h1>
          <p className="mt-4 text-xl font-medium text-[#334155]">
            Consulta disponibilidad, ocupación y rentas por zona.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => go(navigate)}
              className="flex items-center gap-3 rounded-2xl bg-[#b3d700] px-8 py-4 font-bold text-slate-950 shadow-lg transition-all hover:bg-[#a2c400]"
            >
              Explorar el mercado
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0F172A] text-[#b3d700]">
                <ArrowRight size={16} strokeWidth={2.75} />
              </span>
            </button>
            <span className="text-sm font-bold text-emerald-700">✓ Acceso público · Sin registro</span>
          </div>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              [formatAreaM2(mockQ1Kpis.totalInventoryM2), 'Inventario Q1'],
              [formatPct(mockQ1Kpis.vacancyPct), 'Vacancia Q1'],
              [formatUsdM2(mockQ1Kpis.avgRentUsd), 'Renta prom.'],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-2xl border border-white/60 bg-[#EBF0F5] p-3 shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]"
              >
                <dd className="text-lg font-extrabold text-[#0F172A]">{v}</dd>
                <dt className="text-[11px] font-semibold text-slate-600">{l}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Sunset showcase visual */}
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border border-white/80 shadow-[12px_12px_28px_#c5ccd6,-12px_-12px_28px_#ffffff]">
          <img
            src="/Industrial%20Logistics%20Park%20at%20Sunset.png"
            alt="Parque Industrial Jalisco en Atardecer"
            className="h-full w-full transform object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Floating Glassmorphism Badge */}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/75 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#b3d700]"></span>
            📍 Jalisco · Ecosistema industrial
          </div>
          {/* APIEJ 3-Color Decorative Accent Stripe in corner */}
          <div className="absolute right-4 top-4 flex gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 p-2 backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff8d00]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#b3d700]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#00a2ff]"></span>
          </div>
        </div>
      </main>

      {/* Quick exploration */}
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-12 md:grid-cols-3 md:px-6">
        {CARDS.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() => go(navigate, c.view)}
            className="group flex items-center gap-4 rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-5 text-left shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff] transition-all duration-300 hover:shadow-[10px_10px_18px_#c5ccd6,-10px_-10px_18px_#ffffff]"
          >
            <span className={`rounded-2xl bg-[#E2E8F0] p-3 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] ${c.accent}`}>
              <c.icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-[#0F172A]">{c.title} ↗</span>
              <span className="block truncate text-xs font-medium text-slate-600">{c.desc}</span>
            </span>
            <ArrowUpRight size={16} className={`shrink-0 text-slate-500 transition group-hover:translate-x-0.5 ${c.hover}`} />
          </button>
        ))}
      </section>

      {/* Acerca */}
      <section id="acerca" className="mx-auto w-full max-w-6xl px-4 pb-12 md:px-6">
        <div className="rounded-[2.2rem] border border-white/60 bg-[#EBF0F5] p-6 shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff] md:p-8">
          <h2 className="font-display text-xl font-extrabold text-[#0F172A]">Acerca de APIEJ</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            La Asociación de Parques Industriales del Estado de Jalisco centraliza la inteligencia del mercado:
            una sola fuente de verdad con snapshots trimestrales, aislamiento multi-tenant y validación experta.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-5 text-xs font-semibold text-slate-600 md:px-6">
          <span className="font-extrabold text-[#0F172A]">APIEJ · Industrial Parks</span>
          <span className="ml-auto flex gap-4">
            <a href="#acerca" className="transition hover:text-[#0F172A]">Contacto</a>
            <a href="#acerca" className="transition hover:text-[#0F172A]">Privacidad</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
