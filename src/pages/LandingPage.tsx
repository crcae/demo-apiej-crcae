import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Building2, ChevronLeft, ChevronRight,
  Info, Link2, Map, Rocket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockQ1Kpis } from '../mock/market.mock.js';
import { formatAreaM2, formatPct } from '../utils/formatters.js';

type EntryView = 'dashboard' | 'mapa';

function go(navigate: (to: string, opts?: { state?: { view?: EntryView } }) => void, view?: EntryView): void {
  navigate('/dashboard', view === undefined ? undefined : { state: { view } });
}

function scrollTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const METRICS = [
  { value: formatAreaM2(mockQ1Kpis.totalInventoryM2), label: 'Inventario industrial', bar: 'border-[#ff8d00]' },
  { value: formatPct(mockQ1Kpis.vacancyPct), label: 'Tasa de disponibilidad', bar: 'border-[#b3d700]' },
  { value: `$${mockQ1Kpis.avgRentUsd?.toFixed(2) ?? '—'}`, label: 'Renta promedio · USD/m²', bar: 'border-[#00a2ff]' },
];

const EXPLORER: Array<{ n: string; icon: typeof Map; title: string; desc: string; view: EntryView; accent: string }> = [
  { n: '01', icon: Building2, title: 'Disponibilidad', desc: 'Naves y terrenos en renta o venta', view: 'dashboard', accent: 'text-[#ff8d00]' },
  { n: '02', icon: Map, title: 'Mapa industrial', desc: 'Parques y corredores de Jalisco', view: 'mapa', accent: 'text-[#65A30D]' },
  { n: '03', icon: BarChart3, title: 'Indicadores y reportes', desc: 'Análisis trimestral y anual', view: 'dashboard', accent: 'text-[#00a2ff]' },
];

const DEVELOPERS = ['Axis', 'Bexalta', 'Vesta', 'Elite'];

const PILLARS = [
  { icon: Link2, label: 'Conectamos', dot: 'bg-[#ff8d00]' },
  { icon: Info, label: 'Informamos', dot: 'bg-[#b3d700]' },
  { icon: Rocket, label: 'Impulsamos', dot: 'bg-[#00a2ff]' },
];

export function LandingPage(): React.JSX.Element {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (el === null) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (el.scrollLeft >= max - 8) el.scrollTo({ left: 0, behavior: 'auto' });
      else el.scrollBy({ left: 2, behavior: 'auto' });
    }, 30);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  function nudge(dir: 1 | -1): void {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen w-full bg-[#EBF0F5] text-[#0F172A]">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-5 md:px-6">
        <button type="button" onClick={scrollTop} title="Volver arriba" className="shrink-0">
          <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain" />
        </button>
        <nav className="ml-6 hidden items-center gap-5 text-sm font-bold text-slate-600 md:flex">
          <a href="#explora" className="transition hover:text-[#0F172A]">Disponibilidad</a>
          <button type="button" onClick={() => go(navigate, 'mapa')} className="transition hover:text-[#0F172A]">
            Mapa industrial
          </button>
          <a href="#cifras" className="transition hover:text-[#0F172A]">Indicadores</a>
          <a href="#institucional" className="transition hover:text-[#0F172A]">Conoce APIEJ</a>
        </nav>
        <button
          type="button"
          onClick={() => go(navigate)}
          className="ml-auto rounded-2xl bg-[#00a2ff] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#008cdc]"
        >
          Iniciar sesión ↗
        </button>
      </header>

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-6 md:grid-cols-2 md:px-6 md:pt-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1" aria-hidden="true">
              <i className="h-4 w-1.5 rounded-full bg-[#ff8d00]" />
              <i className="h-4 w-1.5 rounded-full bg-[#b3d700]" />
              <i className="h-4 w-1.5 rounded-full bg-[#00a2ff]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#334155]">
              APIEJ / Observatorio Industrial
            </span>
          </div>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight text-slate-950">
            El pulso industrial de Jalisco.
          </h1>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            Datos claros. Mejores decisiones.
          </p>
          <p className="mt-1 text-lg text-slate-600">
            Inventario, disponibilidad y tendencias del mercado.
          </p>
          <div className="mt-7 inline-flex flex-col items-stretch">
            <button
              type="button"
              onClick={() => go(navigate)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#b3d700] px-8 py-4 font-black text-slate-950 shadow-xl transition-all hover:bg-[#a1c200]"
            >
              Explorar el mercado ➔
            </button>
            <span className="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700">
              ✔ Acceso público · Sin registro
            </span>
          </div>
        </div>

        {/* Composite visual */}
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

      {/* Metrics */}
      <section id="cifras" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-12 md:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold text-[#0F172A]">El mercado en cifras</h2>
          <span className="text-xs font-medium text-slate-500">T1 · Cifras ilustrativas</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className={`rounded-[2rem] border border-white/60 border-t-4 ${m.bar} bg-[#EBF0F5] p-6 shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff]`}
            >
              <p className="text-4xl font-extrabold tracking-tight text-[#0F172A]">{m.value}</p>
              <p className="mt-1 text-sm font-medium text-[#334155]">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Explorer */}
      <section id="explora" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-12 md:px-6">
        <h2 className="font-display text-xl font-extrabold text-[#0F172A]">Explora el mercado</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">Encuentra espacios. Ubica oportunidades. Entiende el mercado.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {EXPLORER.map((c) => (
            <button
              key={c.n}
              type="button"
              onClick={() => go(navigate, c.view)}
              className="cursor-pointer rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-6 text-left shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff] transition-all duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_18px_#c5ccd6,-10px_-10px_18px_#ffffff]"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-2xl bg-[#E2E8F0] p-3 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] ${c.accent}`}>
                  <c.icon size={22} />
                </span>
                <span className="text-3xl font-black text-slate-300">{c.n}</span>
              </div>
              <p className="mt-4 text-lg font-extrabold text-[#0F172A]">{c.title}</p>
              <p className="mt-1 text-sm font-medium text-[#334155]">{c.desc}</p>
              <p className="mt-4 text-sm font-extrabold text-[#0F172A]">➔</p>
            </button>
          ))}
        </div>
      </section>

      {/* Collaborators */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 md:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#0F172A]">Nuestros colaboradores</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Desarrolladores</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button" onClick={() => nudge(-1)} title="Anterior"
              className="rounded-full bg-[#E2E8F0] p-2.5 text-[#0F172A] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] transition hover:shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button" onClick={() => nudge(1)} title="Siguiente"
              className="rounded-full bg-[#E2E8F0] p-2.5 text-[#0F172A] shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] transition hover:shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[...DEVELOPERS, ...DEVELOPERS].map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="flex w-56 shrink-0 snap-start items-center justify-center rounded-[2rem] border border-white/60 bg-[#EBF0F5] px-6 py-8 shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff]"
            >
              <span className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A]">{d}</span>
            </div>
          ))}
          <div className="flex w-56 shrink-0 items-center justify-center rounded-[2rem] border border-white/60 bg-[#E2E8F0] px-6 py-8 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
            <span className="text-sm font-bold text-slate-600">+ aliados del ecosistema</span>
          </div>
        </div>
      </section>

      {/* Institutional */}
      <section id="institucional" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-12 md:px-6">
        <div className="grid gap-6 rounded-[2.2rem] border border-white/60 bg-[#EBF0F5] p-6 shadow-[7px_7px_14px_#c5ccd6,-7px_-7px_14px_#ffffff] md:grid-cols-2 md:p-8">
          <div className="relative flex flex-col items-start justify-center overflow-hidden rounded-[2rem] bg-[#E2E8F0] p-8 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#b3d700]/15 blur-2xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-[#00a2ff]/10 blur-2xl"
            />
            <p className="relative text-sm font-semibold text-slate-700">
              Asociación de Parques Industriales del Estado de Jalisco
            </p>
            <img src="/apiej_logo.png" alt="APIEJ" className="relative mt-3 h-16 w-auto object-contain" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Juntos impulsamos Jalisco.</h2>
            <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-600">
              Conectamos al sector industrial para compartir información y crecer juntos.
            </p>
            <ul className="mt-4 space-y-2.5">
              {PILLARS.map((p) => (
                <li key={p.label} className="flex items-center gap-2.5 text-sm font-bold text-[#0F172A]">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[#E2E8F0] shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]`}>
                    <p.icon size={15} className={p.dot.replace('bg-', 'text-')} />
                  </span>
                  {p.label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => go(navigate)}
              className="mt-5 rounded-2xl bg-[#ff8d00] px-7 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:bg-[#e07c00]"
            >
              Conoce APIEJ ↗
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-5 text-xs font-semibold text-slate-600 md:px-6">
          <span className="font-extrabold text-[#0F172A]">APIEJ · Observatorio Industrial</span>
          <span className="ml-auto">Propuesta visual · Portada</span>
        </div>
      </footer>
    </div>
  );
}
