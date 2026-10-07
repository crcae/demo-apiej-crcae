import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BarChart3, Building2, ChevronLeft, ChevronRight, Map } from 'lucide-react';
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

const HERO_IMG = '/ChatGPT%20Image%20Oct%206,%202026%20at%2006_46_28%20PM.png';
const HERO_FALLBACK = '/Industrial%20Logistics%20Park%20at%20Sunset.png';

const STEPS: Array<{ n: string; icon: typeof Map; box: string; title: string; desc: string; view: EntryView; arrow: string; line: string }> = [
  { n: '01', icon: Building2, box: 'bg-amber-500/10 text-amber-600', title: 'Disponibilidad', desc: 'Naves y terrenos en renta o venta', view: 'dashboard', arrow: 'group-hover:text-amber-500', line: 'group-hover:border-amber-500' },
  { n: '02', icon: Map, box: 'bg-emerald-500/10 text-emerald-600', title: 'Mapa industrial', desc: 'Parques y corredores de Jalisco', view: 'mapa', arrow: 'group-hover:text-emerald-500', line: 'group-hover:border-emerald-500' },
  { n: '03', icon: BarChart3, box: 'bg-blue-500/10 text-blue-600', title: 'Indicadores y reportes', desc: 'Análisis trimestral y anual', view: 'dashboard', arrow: 'group-hover:text-blue-500', line: 'group-hover:border-blue-500' },
];

const DEVS = [
  { name: 'AXIS', cls: 'tracking-wider', sub: 'Parque Industrial', subCls: 'text-[10px] text-slate-500 font-bold uppercase' },
  { name: 'Bexalta', cls: 'tracking-tight', sub: 'Inmobiliaria Inteligente', subCls: 'text-[10px] text-slate-500 font-semibold' },
  { name: 'VESTA', cls: 'tracking-widest', sub: '', subCls: '' },
  { name: 'ELITE', cls: 'tracking-widest', sub: 'LAST MILE INDUSTRIAL PARKS', subCls: 'text-[8px] text-slate-500 font-black tracking-widest' },
];

/** Fade/slide reveal on scroll (once). */
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

  useEffect(() => {
    const t = window.setTimeout(() => setStatsOn(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  const inv = useCountUp(mockQ1Kpis.totalInventoryM2, statsOn);
  const vac = useCountUp(mockQ1Kpis.vacancyPct, statsOn);
  const rent = useCountUp(mockQ1Kpis.avgRentUsd ?? 0, statsOn);

  const stats: Array<{ value: string; label: string; bar: string }> = [
    { value: formatAreaM2(inv), label: 'Inventario industrial', bar: 'border-amber-500' },
    { value: formatPct(vac), label: 'Tasa de disponibilidad', bar: 'border-emerald-500' },
    { value: `$${rent.toFixed(2)}`, label: 'Renta promedio · USD/m²', bar: 'border-blue-500' },
  ];

  function nudge(dir: 1 | -1): void {
    stripRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-8 py-4 backdrop-blur-md">
        <button type="button" onClick={scrollTop} title="Volver arriba" className="flex items-center">
          <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain" />
          <span className="ml-3 border-l border-slate-300 pl-3 text-xs font-bold tracking-wider text-slate-400">
            JALISCO INTELLIGENCE
          </span>
        </button>
        <nav className="hidden items-center gap-8 text-xs font-bold text-slate-700 md:flex">
          <button type="button" onClick={() => go(navigate, 'dashboard')} className="transition-colors hover:text-slate-950">
            Disponibilidad
          </button>
          <button type="button" onClick={() => go(navigate, 'mapa')} className="transition-colors hover:text-slate-950">
            Mapa industrial
          </button>
          <a href="#cifras" className="transition-colors hover:text-slate-950">Indicadores</a>
          <a href="#institucional" className="transition-colors hover:text-slate-950">Conoce APIEJ</a>
        </nav>
        <button
          type="button"
          onClick={() => go(navigate)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#00a2ff] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#008cdc]"
        >
          Iniciar sesión ↗
        </button>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {/* Hero — bright image left, dark reading panel right */}
        <section className="relative mb-10 flex min-h-[520px] w-full items-stretch overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl md:min-h-[560px]">
          <img
            src={heroSrc}
            alt="Parque industrial de Jalisco al atardecer"
            onError={() => { if (heroSrc !== HERO_FALLBACK) setHeroSrc(HERO_FALLBACK); }}
            className="animate-kenburns absolute inset-0 z-0 h-full w-full object-cover object-center"
          />
          {/* Dark gradient concentrated on the RIGHT where the copy lives */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-slate-950/95 via-slate-950/45 to-transparent" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

          {/* Floating live chip over the bright side */}
          <div className="absolute bottom-8 left-8 z-20 hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/55 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#b3d700]"></span>
            Q1 2026 · 68,500 m² verificados
          </div>

          {/* Copy panel — right */}
          <div className="relative z-20 ml-auto flex w-full max-w-xl flex-col justify-center p-8 md:p-12">
            <div className="flex items-center gap-2.5">
              <span className="flex flex-row gap-1.5" aria-hidden="true">
                <i className="h-1.5 w-6 rounded-full bg-[#f59e0b]" />
                <i className="h-1.5 w-6 rounded-full bg-[#10b981]" />
                <i className="h-1.5 w-6 rounded-full bg-[#00a2ff]" />
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
            <div className="mt-7">
              <button
                type="button"
                onClick={() => go(navigate)}
                className="flex transform cursor-pointer items-center gap-2 rounded-2xl bg-[#b3d700] px-7 py-3.5 text-sm font-black tracking-wide text-slate-950 shadow-2xl transition-all duration-200 hover:scale-[1.03] hover:bg-[#a2c400]"
              >
                Explorar el mercado ➔
              </button>
              <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/60 px-3.5 py-1 text-xs font-semibold text-white/95 shadow-sm backdrop-blur-md">
                ✔ Acceso público · Sin registro
              </span>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section id="cifras" className="mb-12 scroll-mt-24">
          <Reveal>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">El mercado en cifras</h2>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <i className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                T1 · Cifras ilustrativas · LIVE
              </span>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className={`h-full rounded-2xl border border-slate-200/60 border-t-4 ${s.bar} bg-white/90 p-6 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                  <p className="text-3xl font-black tabular-nums text-slate-950">{s.value}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Explorer */}
        <section id="explora" className="mb-12 scroll-mt-24">
          <Reveal>
            <h2 className="text-2xl font-black text-slate-950">Explora el mercado</h2>
            <p className="mb-4 mt-1 text-xs font-medium text-slate-500">Encuentra espacios. Ubica oportunidades. Entiende el mercado.</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((c, i) => (
              <Reveal key={c.n} delay={i * 90}>
                <button
                  type="button"
                  onClick={() => go(navigate, c.view)}
                  className={`group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.line} border-b-4`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-fit rounded-xl p-2.5 ${c.box}`}>
                      <c.icon size={20} />
                    </span>
                    <span className="absolute right-6 top-6 text-2xl font-black text-slate-300">{c.n}</span>
                  </div>
                  <p className="mt-4 text-lg font-extrabold text-slate-950">{c.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
                  <p className={`mt-4 text-base font-bold text-slate-400 transition-all group-hover:translate-x-1 ${c.arrow}`}>➔</p>
                  <span className={`pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl border-b-4 opacity-0 transition-opacity ${c.line.replace('group-hover:', '')} group-hover:opacity-100`} />
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Collaborators */}
        <section className="mb-12">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Nuestros colaboradores</h2>
                <p className="mt-0.5 block text-xs font-medium text-slate-500">Desarrolladores</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => nudge(-1)} title="Anterior"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button" onClick={() => nudge(1)} title="Siguiente"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </Reveal>
          <div ref={stripRef} className="my-4 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden">
            {DEVS.map((d) => (
              <div key={d.name} className="w-52 shrink-0 rounded-2xl bg-white px-6 py-7 text-center shadow-md ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-[#b3d700]/50 md:w-auto">
                <p className={`text-2xl font-black text-slate-900 ${d.cls}`}>{d.name}</p>
                {d.sub !== '' && <p className={`mt-1 ${d.subCls}`}>{d.sub}</p>}
              </div>
            ))}
          </div>
          <button
            type="button" onClick={() => go(navigate, 'mapa')}
            className="mt-3 flex cursor-pointer items-center gap-1 text-xs font-bold text-[#00a2ff] transition hover:underline"
          >
            Ver todos los desarrolladores ➔
          </button>
        </section>

        {/* Institutional banner */}
        <section id="institucional" className="my-10 scroll-mt-24">
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-100/90 via-slate-100/90 to-[#b3d700]/10 p-8 shadow-sm transition-all duration-300 hover:shadow-lg md:grid-cols-12 md:p-10">
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm md:col-span-5">
                <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#00a2ff]/10 blur-2xl" />
                <div className="mb-4 flex flex-row gap-1.5" aria-hidden="true">
                  <i className="h-2 w-2 rounded-full bg-[#ff8d00]" />
                  <i className="h-2 w-2 rounded-full bg-[#b3d700]" />
                  <i className="h-2 w-2 rounded-full bg-[#00a2ff]" />
                </div>
                <img src="/apiej_logo.png" alt="APIEJ" className="h-16 w-auto object-contain" />
                <p className="mt-4 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                  Asociación de Parques Industriales del Estado de Jalisco · APIEJ Industrial Parks
                </p>
              </div>
              <div className="md:col-span-7">
                <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Juntos impulsamos Jalisco.</h2>
                <p className="mb-6 mt-2 text-sm font-medium text-slate-600">
                  Conectamos al sector industrial para compartir información y crecer juntos.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <span className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-slate-800 transition-all duration-300 hover:-translate-y-0.5">🟧 Conectamos</span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-slate-800 transition-all duration-300 hover:-translate-y-0.5">🟩 Informamos</span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-slate-800 transition-all duration-300 hover:-translate-y-0.5">🟦 Impulsamos</span>
                </div>
                <button
                  type="button"
                  onClick={() => go(navigate)}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#ff9100] px-7 py-3 text-xs font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#e08000] hover:shadow-xl"
                >
                  Conoce APIEJ ↗
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-slate-400 md:px-6">
          <span className="font-bold">APIEJ · Observatorio Industrial</span>
          <span>Propuesta visual · Portada</span>
        </div>
      </footer>
    </div>
  );
}
