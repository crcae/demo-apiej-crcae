import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BarChart3, Building2, ChevronLeft, ChevronRight, Map, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoadNetworkBg } from '../components/RoadNetworkBg.js';
import { mockQ1Kpis } from '../mock/market.mock.js';
import { formatAreaM2, formatPct } from '../utils/formatters.js';

type EntryView = 'dashboard' | 'mapa' | 'inventario' | 'reportes';

function go(navigate: (to: string, opts?: { state?: { view?: EntryView } }) => void, view?: EntryView): void {
  navigate('/dashboard', view === undefined ? undefined : { state: { view } });
}

function scrollTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const HERO_IMG = '/ChatGPT%20Image%20Oct%206,%202026%20at%2006_46_28%20PM.png';
const HERO_FALLBACK = '/Industrial%20Logistics%20Park%20at%20Sunset.png';

const STEPS: Array<{ n: string; icon: typeof Map; box: string; title: string; desc: string; view: EntryView; arrow: string; line: string }> = [
  { n: '01', icon: Warehouse, box: 'bg-amber-500/10 text-amber-600', title: 'Ver propiedades', desc: 'Inventario industrial en renta o venta', view: 'inventario', arrow: 'group-hover:text-amber-500', line: 'group-hover:border-amber-500' },
  { n: '02', icon: Map, box: 'bg-emerald-500/10 text-emerald-600', title: 'Mapa industrial', desc: 'Parques y corredores de Jalisco', view: 'mapa', arrow: 'group-hover:text-emerald-500', line: 'group-hover:border-emerald-500' },
  { n: '03', icon: BarChart3, box: 'bg-blue-500/10 text-blue-600', title: 'Indicadores y reportes', desc: 'Análisis trimestral y anual', view: 'reportes', arrow: 'group-hover:text-blue-500', line: 'group-hover:border-blue-500' },
];

const DEVS = [
  { name: 'AXIS', cls: 'tracking-wider', sub: 'Parque Industrial', subCls: 'text-[10px] text-slate-500 font-bold uppercase' },
  { name: 'Bexalta', cls: 'tracking-tight', sub: 'Inmobiliaria Inteligente', subCls: 'text-[10px] text-slate-500 font-semibold' },
  { name: 'VESTA', cls: 'tracking-widest', sub: '', subCls: '' },
  { name: 'ELITE', cls: 'tracking-widest', sub: 'LAST MILE INDUSTRIAL PARKS', subCls: 'text-[8px] text-slate-500 font-black tracking-widest' },
];

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVis(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting === true) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${vis ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
    >
      {children}
    </div>
  );
}

function useCountUp(target: number, run: boolean, dur = 1500): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number): void => {
      const p = Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, dur]);
  return v;
}

export function LandingPage(): React.JSX.Element {
  const navigate = useNavigate();
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [heroSrc, setHeroSrc] = useState(HERO_IMG);
  const [statsOn, setStatsOn] = useState(false);
  const [stripPaused, setStripPaused] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStatsOn(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stripPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      const el = stripRef.current;
      if (el === null || el.scrollWidth <= el.clientWidth) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 8) el.scrollTo({ left: 0, behavior: 'auto' });
      else el.scrollBy({ left: 1.5, behavior: 'auto' });
    }, 32);
    return () => window.clearInterval(id);
  }, [stripPaused]);

  const inv = useCountUp(mockQ1Kpis.totalInventoryM2, statsOn);
  const vac = useCountUp(mockQ1Kpis.vacancyPct, statsOn);
  const rent = useCountUp(mockQ1Kpis.avgRentUsd ?? 0, statsOn);

  const stats: Array<{ value: string; label: string; bar: string; glow: string }> = [
    { value: formatAreaM2(inv), label: 'Inventario industrial', bar: 'border-[#FF7A00]', glow: 'hover:shadow-[0_18px_40px_-18px_rgba(255,122,0,0.55)]' },
    { value: formatPct(vac), label: 'Tasa de disponibilidad', bar: 'border-[#10B981]', glow: 'hover:shadow-[0_18px_40px_-18px_rgba(16,185,129,0.55)]' },
    { value: `$${rent.toFixed(2)}`, label: 'Renta promedio · USD/m²', bar: 'border-[#4A6CFF]', glow: 'hover:shadow-[0_18px_40px_-18px_rgba(74,108,255,0.55)]' },
  ];

  function nudge(dir: 1 | -1): void {
    stripRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#F8FAFC] text-slate-950">
      <RoadNetworkBg />
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 right-[8%] z-[1] h-96 w-96 rounded-full bg-[#4A6CFF]/12 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute left-[4%] top-[38%] z-[1] h-80 w-80 rounded-full bg-[#FF7A00]/10 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[12%] right-[12%] z-[1] h-72 w-72 rounded-full bg-[#10B981]/10 blur-3xl" />

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0E1A3D]/95 px-6 py-3.5 text-white backdrop-blur-md md:px-8">
        <button type="button" onClick={scrollTop} title="Inicio APIEJ" className="flex items-center">
          <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain brightness-0 invert" />
          <span className="ml-3 hidden border-l border-white/25 pl-3 text-xs font-bold tracking-wider text-white/65 sm:block">
            JALISCO INTELLIGENCE
          </span>
        </button>
        <nav className="hidden items-center gap-7 text-xs font-bold text-white/80 md:flex">
          <button type="button" onClick={() => go(navigate, 'inventario')} className="transition-colors hover:text-white">
            Ver propiedades
          </button>
          <button type="button" onClick={() => go(navigate, 'mapa')} className="transition-colors hover:text-white">
            Mapa industrial
          </button>
          <a href="#cifras" className="transition-colors hover:text-white">Indicadores</a>
          <a href="#institucional" className="transition-colors hover:text-white">Conoce APIEJ</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(navigate, 'inventario')}
            className="hidden cursor-pointer items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 sm:flex"
          >
            <Building2 size={14} /> Ver propiedades
          </button>
          <button
            type="button"
            onClick={() => go(navigate)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#4A6CFF] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#3b5aef] hover:shadow-lg"
          >
            Iniciar sesión ↗
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6">
        <section className="relative mb-10 mt-6 flex min-h-[520px] w-full items-stretch overflow-hidden rounded-3xl border border-[#0E1A3D]/40 bg-[#0E1A3D] shadow-2xl md:min-h-[560px]">
          <img
            src={heroSrc}
            alt="Parque industrial de Jalisco al atardecer"
            onError={() => { if (heroSrc !== HERO_FALLBACK) setHeroSrc(HERO_FALLBACK); }}
            className="animate-kenburns absolute inset-0 z-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-[#0E1A3D]/95 via-[#0E1A3D]/50 to-transparent" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0E1A3D]/70 via-transparent to-transparent md:hidden" />

          <div className="absolute bottom-8 left-8 z-20 hidden items-center gap-2 rounded-full border border-white/20 bg-[#0E1A3D]/55 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" />
            Q1 2026 · 68,500 m² verificados
          </div>

          <div className="animate-enter relative z-20 ml-auto flex w-full max-w-xl flex-col justify-center p-8 md:p-12">
            <div className="flex items-center gap-2.5">
              <span className="flex flex-row gap-1.5" aria-hidden="true">
                <i className="h-1.5 w-6 rounded-full bg-[#FF7A00] shadow-[0_0_12px_rgba(255,122,0,0.8)]" />
                <i className="h-1.5 w-6 rounded-full bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                <i className="h-1.5 w-6 rounded-full bg-[#4A6CFF] shadow-[0_0_12px_rgba(74,108,255,0.8)]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                APIEJ / Observatorio Industrial
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black leading-none tracking-tight text-white drop-shadow-lg md:text-5xl">
              El pulso industrial de Jalisco.
            </h1>
            <p className="mt-4 text-lg font-bold text-white drop-shadow md:text-xl">
              Datos claros. Mejores decisiones.
            </p>
            <p className="mt-1 text-sm font-medium text-slate-300">
              Inventario, disponibilidad y tendencias del mercado.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => go(navigate, 'inventario')}
                className="flex transform cursor-pointer items-center gap-2 rounded-2xl bg-[#FF7A00] px-7 py-3.5 text-sm font-black tracking-wide text-white shadow-2xl transition-all duration-200 hover:scale-[1.03] hover:bg-[#e86e00]"
              >
                Ver propiedades ➔
              </button>
              <button
                type="button"
                onClick={() => go(navigate, 'mapa')}
                className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Explorar mapa
              </button>
            </div>
            <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-[#0E1A3D]/60 px-3.5 py-1 text-xs font-semibold text-white/95 shadow-sm backdrop-blur-md">
              ✔ Acceso público · Sin registro
            </span>
          </div>
        </section>

        <section id="cifras" className="mb-12 scroll-mt-24">
          <Reveal>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-black text-[#0E1A3D]">El mercado en cifras</h2>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <i className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                T1 · Cifras ilustrativas · LIVE
              </span>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className={`h-full rounded-2xl border border-slate-200/60 border-t-4 ${s.bar} bg-white/90 p-6 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 ${s.glow}`}>
                  <p className="text-3xl font-black tabular-nums text-[#0E1A3D]">{s.value}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="explora" className="mb-12 scroll-mt-24">
          <Reveal>
            <h2 className="font-display text-2xl font-black text-[#0E1A3D]">Explora el mercado</h2>
            <p className="mb-4 mt-1 text-xs font-medium text-slate-500">Encuentra espacios. Ubica oportunidades. Entiende el mercado.</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((c, i) => (
              <Reveal key={c.n} delay={i * 90}>
                <button
                  type="button"
                  onClick={() => go(navigate, c.view)}
                  className={`group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.line} border-b-4`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-fit rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${c.box}`}>
                      <c.icon size={20} />
                    </span>
                    <span className="absolute right-6 top-6 text-2xl font-black text-slate-300">{c.n}</span>
                  </div>
                  <p className="mt-4 text-lg font-extrabold text-[#0E1A3D]">{c.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
                  <p className={`mt-4 text-base font-bold text-slate-400 transition-all group-hover:translate-x-1 ${c.arrow}`}>➔</p>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-[#0E1A3D]">Nuestros colaboradores</h2>
                <p className="mt-0.5 block text-xs font-medium text-slate-500">Desarrolladores</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => nudge(-1)} title="Anterior" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 shadow-sm transition hover:bg-slate-100">
                  <ChevronLeft size={15} />
                </button>
                <button type="button" onClick={() => nudge(1)} title="Siguiente" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 shadow-sm transition hover:bg-slate-100">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </Reveal>
          <div
            ref={stripRef}
            onMouseEnter={() => setStripPaused(true)}
            onMouseLeave={() => setStripPaused(false)}
            onTouchStart={() => setStripPaused(true)}
            onTouchEnd={() => setStripPaused(false)}
            className="my-4 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden"
          >
            {DEVS.map((d) => (
              <div key={d.name} className="w-52 shrink-0 rounded-2xl bg-white px-6 py-7 text-center shadow-md ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-[#4A6CFF]/40 md:w-auto">
                <p className={`text-2xl font-black text-[#0E1A3D] ${d.cls}`}>{d.name}</p>
                {d.sub !== '' && <p className={`mt-1 ${d.subCls}`}>{d.sub}</p>}
              </div>
            ))}
          </div>
        </section>

        <section id="institucional" className="my-10 scroll-mt-24">
          <Reveal>
            <div className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl border border-[#0E1A3D]/10 bg-gradient-to-br from-[#0E1A3D] to-[#1a2d5c] p-8 text-white shadow-lg md:grid-cols-12 md:p-10">
              <div className="relative rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur md:col-span-5">
                <img src="/apiej_logo.png" alt="APIEJ" className="mx-auto h-16 w-auto object-contain brightness-0 invert" />
                <p className="mt-4 text-[9px] font-extrabold uppercase tracking-widest text-white/50">
                  Asociación de Parques Industriales del Estado de Jalisco
                </p>
              </div>
              <div className="relative md:col-span-7">
                <h2 className="font-display text-3xl font-black tracking-tight md:text-4xl">Juntos impulsamos Jalisco.</h2>
                <p className="mb-6 mt-2 text-sm font-medium text-white/70">
                  Conectamos al sector industrial para compartir información y crecer juntos.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <span className="rounded-xl bg-[#FF7A00]/20 px-3.5 py-1.5 text-xs font-bold text-[#FFB366]">Conectamos</span>
                  <span className="rounded-xl bg-[#10B981]/20 px-3.5 py-1.5 text-xs font-bold text-[#6EE7B7]">Informamos</span>
                  <span className="rounded-xl bg-[#4A6CFF]/20 px-3.5 py-1.5 text-xs font-bold text-[#A5B4FC]">Impulsamos</span>
                </div>
                <button
                  type="button"
                  onClick={() => go(navigate)}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#4A6CFF] px-7 py-3 text-xs font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#3b5aef]"
                >
                  Entrar a la plataforma ↗
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <footer className="relative z-10 border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-slate-400 md:px-6">
          <span className="font-bold text-[#0E1A3D]/70">APIEJ · Observatorio Industrial</span>
          <span>Demo presentación · 2026</span>
        </div>
      </footer>
    </div>
  );
}
