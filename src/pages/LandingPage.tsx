import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3, Building2, ChevronLeft, ChevronRight, LayoutDashboard, Map, Search, Warehouse,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContentMotionBg } from '../components/ContentMotionBg.js';
import { RoadNetworkBg } from '../components/RoadNetworkBg.js';
import { CORRIDORS } from '../mock/corridors.mock.js';
import { mockQ1Kpis } from '../mock/market.mock.js';
import { formatAreaM2, formatPct } from '../utils/formatters.js';

type EntryView = 'dashboard' | 'mapa' | 'reportes';

function go(navigate: (to: string, opts?: { state?: { view?: EntryView } }) => void, view?: EntryView): void {
  navigate('/dashboard', view === undefined ? undefined : { state: { view } });
}

function scrollTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const HERO_IMG = '/ChatGPT%20Image%20Oct%206,%202026%20at%2006_46_28%20PM.png';
const HERO_FALLBACK = '/Industrial%20Logistics%20Park%20at%20Sunset.png';

type ExploreStep =
  | { n: string; icon: typeof Map; accent: string; title: string; desc: string; kind: 'public' }
  | { n: string; icon: typeof Map; accent: string; title: string; desc: string; kind: 'system'; view: EntryView };

const STEPS: ExploreStep[] = [
  { n: '01', icon: Warehouse, accent: '#FF7A00', title: 'Ver propiedades', desc: 'Catálogo público en renta o venta', kind: 'public' },
  { n: '02', icon: Map, accent: '#10B981', title: 'Mapa industrial', desc: 'Parques y corredores de Jalisco', kind: 'system', view: 'mapa' },
  { n: '03', icon: BarChart3, accent: '#4A6CFF', title: 'Indicadores y reportes', desc: 'Análisis trimestral (requiere sesión)', kind: 'system', view: 'reportes' },
];

const HOW: Array<{ n: string; icon: typeof Search; accent: string; title: string; desc: string }> = [
  { n: '01', icon: Search, accent: '#FF7A00', title: 'Consultar propiedades', desc: 'Explora el catálogo público de naves y terrenos sin crear cuenta.' },
  { n: '02', icon: BarChart3, accent: '#10B981', title: 'Monitorear indicadores', desc: 'Sigue inventario, vacancia, absorción y rentas por corredor.' },
  { n: '03', icon: LayoutDashboard, accent: '#4A6CFF', title: 'Operar con sesión', desc: 'Captura, valida y reporta con tu organización en la plataforma.' },
];

const DEVS = [
  { name: 'AXIS', sub: 'Parque Industrial' },
  { name: 'Bexalta', sub: 'Inmobiliaria Inteligente' },
  { name: 'VESTA', sub: 'Industrial REIT' },
  { name: 'ELITE', sub: 'Last Mile Parks' },
];

function useCountUp(target: number, run: boolean, dur = 1600): number {
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
  const reduce = useReducedMotion();
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [heroSrc, setHeroSrc] = useState(HERO_IMG);
  const [statsOn, setStatsOn] = useState(false);
  const [stripPaused, setStripPaused] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStatsOn(true), 400);
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

  const fadeUp = reduce
    ? {}
    : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.55 } };

  function nudge(dir: 1 | -1): void {
    stripRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#0B1228] text-slate-950">
      <RoadNetworkBg />

      <header className="sticky top-0 z-50 text-white shadow-lg shadow-black/20">
        <div className="border-b border-white/10 bg-[#0E1A3D]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
            <button type="button" onClick={scrollTop} title="Inicio APIEJ" className="flex items-center">
              <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain brightness-0 invert" />
              <span className="ml-3 hidden border-l border-white/25 pl-3 text-[10px] font-bold tracking-[0.18em] text-white/65 sm:block">
                JALISCO INTELLIGENCE
              </span>
            </button>
            <nav className="hidden items-center gap-7 text-xs font-bold text-white/80 md:flex">
              <a href="#cifras" className="transition hover:text-[#4A6CFF]">Indicadores</a>
              <a href="#cobertura" className="transition hover:text-[#4A6CFF]">Cobertura</a>
              <a href="#institucional" className="transition hover:text-[#4A6CFF]">Conoce APIEJ</a>
            </nav>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/propiedades')}
                className="hidden items-center gap-1.5 rounded-xl border border-[#FF7A00]/50 bg-[#FF7A00]/15 px-4 py-2.5 text-xs font-bold text-[#FFB366] transition hover:bg-[#FF7A00]/25 sm:flex"
              >
                <Building2 size={14} /> Ver propiedades
              </button>
              <button
                type="button"
                onClick={() => go(navigate)}
                className="rounded-xl bg-[#4A6CFF] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#4A6CFF]/20 transition hover:-translate-y-0.5 hover:bg-[#3b5aef]"
              >
                Iniciar sesión ↗
              </button>
            </div>
          </div>
        </div>
        <div className="flex h-[3px] w-full" aria-hidden="true">
          <span className="flex-1 bg-[#FF7A00]" />
          <span className="flex-1 bg-[#10B981]" />
          <span className="flex-1 bg-[#4A6CFF]" />
        </div>
      </header>

      <section className="relative z-10 min-h-[min(92vh,820px)] w-full overflow-hidden">
        <img
          src={heroSrc}
          alt="Parque industrial de Jalisco al atardecer"
          onError={() => { if (heroSrc !== HERO_FALLBACK) setHeroSrc(HERO_FALLBACK); }}
          className="animate-kenburns absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0E1A3D] via-[#0E1A3D]/88 to-[#0E1A3D]/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1228] via-transparent to-[#0E1A3D]/50" />
        {!reduce && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-hero-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-1" aria-hidden="true">
          <span className="flex-1 bg-[#FF7A00]/70" />
          <span className="flex-1 bg-[#10B981]/70" />
          <span className="flex-1 bg-[#4A6CFF]/70" />
        </div>

        <div className="relative z-20 mx-auto flex min-h-[min(92vh,820px)] w-full max-w-6xl flex-col justify-center px-5 py-16 md:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="h-1.5 w-7 rounded-full bg-[#FF7A00]" />
                <i className="h-1.5 w-7 rounded-full bg-[#10B981]" />
                <i className="h-1.5 w-7 rounded-full bg-[#4A6CFF]" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                APIEJ · Observatorio Industrial
              </span>
            </div>
            <h1 className="font-display mt-5 text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-lg md:text-7xl">
              APIEJ
            </h1>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              El pulso industrial de Jalisco.
            </p>
            <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed text-white/80 md:text-base">
              Inventario, disponibilidad y tendencias del mercado — una sola fuente de verdad para socios y tomadores de decisión.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.button
                type="button"
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={() => navigate('/propiedades')}
                className="rounded-2xl bg-[#FF7A00] px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-[#FF7A00]/25 transition hover:bg-[#e86e00]"
              >
                Ver propiedades ➔
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('cifras')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver indicadores
              </button>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0E1A3D]/70 px-3.5 py-1.5 text-[11px] font-semibold text-white/95 backdrop-blur">
              <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" />
              Acceso público · Sin registro
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content with soft motion backdrop — cards stay solid/readable */}
      <div className="relative z-10 overflow-hidden">
        <ContentMotionBg />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-[#0B1228]/30 to-transparent" />
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-5 py-14 md:px-8">
          <section id="cifras" className="scroll-mt-28">
            <motion.div {...fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4A6CFF]">Mercado en vivo</p>
                <h2 className="font-display mt-1 text-3xl font-black text-[#0E1A3D]">El mercado en cifras</h2>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <i className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                T1 2026 · En vivo
              </span>
            </motion.div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                { value: formatAreaM2(inv), label: 'Inventario industrial', color: '#FF7A00' },
                { value: formatPct(vac), label: 'Tasa de disponibilidad', color: '#10B981' },
                { value: `$${rent.toFixed(2)}`, label: 'Renta promedio · USD/m²', color: '#4A6CFF' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={reduce ? undefined : { y: -4 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} />
                  <p className="font-display text-3xl font-black tabular-nums text-[#0E1A3D] md:text-4xl">{s.value}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="explora" className="mt-16 scroll-mt-28">
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF7A00]">Explora</p>
              <h2 className="font-display mt-1 text-3xl font-black text-[#0E1A3D]">Tres puertas al mercado</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Encuentra espacios. Ubica oportunidades. Entiende el mercado.</p>
            </motion.div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {STEPS.map((c, i) => (
                <motion.button
                  key={c.n}
                  type="button"
                  onClick={() => {
                    if (c.kind === 'public') navigate('/propiedades');
                    else go(navigate, c.view);
                  }}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={reduce ? undefined : { y: -4 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: c.accent }} />
                  <span className="absolute right-5 top-5 text-2xl font-black text-slate-100">{c.n}</span>
                  <span
                    className="relative flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
                    style={{ background: `${c.accent}14`, color: c.accent }}
                  >
                    <c.icon size={20} />
                  </span>
                  <p className="relative mt-5 text-lg font-extrabold text-[#0E1A3D]">{c.title}</p>
                  <p className="relative mt-1 text-xs text-slate-500">{c.desc}</p>
                  <p className="relative mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {c.kind === 'public' ? 'Sin sesión' : 'Requiere sesión'}
                  </p>
                  <p className="relative mt-3 text-sm font-bold transition group-hover:translate-x-1" style={{ color: c.accent }}>➔</p>
                </motion.button>
              ))}
            </div>
          </section>

          <section id="cobertura" className="mt-16 scroll-mt-28">
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4A6CFF]">Cobertura ZMG</p>
              <h2 className="font-display mt-1 text-3xl font-black text-[#0E1A3D]">Corredores industriales monitoreados</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
                El Observatorio APIEJ cubre los principales corredores de la Zona Metropolitana de Guadalajara para inventario, disponibilidad y dinámica de mercado.
              </p>
            </motion.div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {CORRIDORS.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm"
                >
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[#0E1A3D]">{c.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{c.short}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="como-funciona" className="mt-16 scroll-mt-28">
            <motion.div {...fadeUp}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#10B981]">Cómo funciona</p>
              <h2 className="font-display mt-1 text-3xl font-black text-[#0E1A3D]">De la consulta a la operación</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Tres pasos para aprovechar el Observatorio APIEJ.</p>
            </motion.div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {HOW.map((h, i) => (
                <motion.div
                  key={h.n}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `${h.accent}14`, color: h.accent }}
                    >
                      <h.icon size={20} />
                    </span>
                    <span className="font-display text-2xl font-black text-slate-100">{h.n}</span>
                  </div>
                  <p className="text-lg font-extrabold text-[#0E1A3D]">{h.title}</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">{h.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <motion.div {...fadeUp} className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#10B981]">Ecosistema</p>
                <h2 className="font-display mt-1 text-3xl font-black text-[#0E1A3D]">Nuestros colaboradores</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => nudge(-1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">
                  <ChevronLeft size={15} />
                </button>
                <button type="button" onClick={() => nudge(1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
            <div
              ref={stripRef}
              onMouseEnter={() => setStripPaused(true)}
              onMouseLeave={() => setStripPaused(false)}
              className="mt-5 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden"
            >
              {DEVS.map((d, i) => (
                <motion.div
                  key={d.name}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={reduce ? undefined : { y: -3 }}
                  className="w-52 shrink-0 rounded-2xl border border-slate-200/80 bg-white px-6 py-8 text-center shadow-sm transition hover:border-[#4A6CFF]/30 hover:shadow-md md:w-auto"
                >
                  <div className="mx-auto mb-3 flex h-1 w-10 gap-0.5 overflow-hidden rounded-full">
                    <span className="flex-1 bg-[#FF7A00]" />
                    <span className="flex-1 bg-[#10B981]" />
                    <span className="flex-1 bg-[#4A6CFF]" />
                  </div>
                  <p className="font-display text-2xl font-black tracking-tight text-[#0E1A3D]">{d.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{d.sub}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="institucional" className="mt-16 scroll-mt-28">
            <motion.div
              {...fadeUp}
              className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1A3D] via-[#152552] to-[#1a2d5c] p-8 text-white shadow-xl ring-1 ring-white/10 md:grid-cols-12 md:p-12"
            >
              <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#4A6CFF]/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-10 h-32 w-32 rounded-full bg-[#FF7A00]/12 blur-3xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur md:col-span-5">
                <div className="mb-4 flex justify-center gap-1.5" aria-hidden="true">
                  <i className="h-2 w-2 rounded-full bg-[#FF7A00]" />
                  <i className="h-2 w-2 rounded-full bg-[#10B981]" />
                  <i className="h-2 w-2 rounded-full bg-[#4A6CFF]" />
                </div>
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
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#4A6CFF] px-7 py-3 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#3b5aef]"
                >
                  Iniciar sesión ↗
                </button>
              </div>
            </motion.div>
          </section>
        </div>

        <footer className="relative z-[2] border-t border-slate-200/80 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 text-xs text-slate-400 md:px-8">
            <span className="font-bold text-[#0E1A3D]/70">APIEJ · Observatorio Industrial</span>
            <span>2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
