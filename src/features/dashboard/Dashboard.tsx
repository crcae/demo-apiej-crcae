import { ArrowRight, Building2, DollarSign, PieChart, Sparkles, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { kpiDeltas } from '../../services/analyticsService.js';
import type { MarketKpis, Period } from '../../types/domain.js';
import { formatAreaM2, formatMxnM2, formatPct, formatUsdM2 } from '../../utils/formatters.js';

export type Currency = 'USD' | 'MXN';

interface Props {
  periods: Period[];
  activePeriodId: string;
  onPeriod: (id: string) => void;
  live: MarketKpis;      // Q2 computed live (recalculates on approval)
  frozen: MarketKpis;    // Q1 frozen seed
  currency: Currency;
  readOnly: boolean;
  fx: number;
  pendingCount: number;
  onGoValidation: () => void;
}

type DeltaTone = 'good' | 'bad' | 'neutral';

const toneCls: Record<DeltaTone, string> = {
  good: 'bg-brand-emerald/10 text-emerald-700 ring-brand-emerald/20',
  bad: 'bg-red-50 text-red-600 ring-red-200',
  neutral: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const bentoCard =
  'rounded-[2.2rem] border border-white/80 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-2xl';

/** SVG radial progress ring for vacancy %. */
function RadialRing({ pct }: { pct: number }): React.JSX.Element {
  const r = 54;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative mx-auto h-40 w-40" title={`${clamped.toFixed(1)}% del inventario está disponible para renta`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#F1F5F9" strokeWidth="13" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="url(#goldRing)" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tight text-[#0F172A]">{formatPct(clamped)}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">vacancia</span>
      </div>
    </div>
  );
}

function MeterLabel({ icon: Icon, iconCls, title, subtitle }: {
  icon: LucideIcon; iconCls: string; title: string; subtitle: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`rounded-2xl p-3 ${iconCls}`}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-[11px] text-slate-400" title={subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: TipEntry[]; label?: string }): React.JSX.Element | null {
  if (active !== true || payload === undefined || payload.length === 0) return null;
  return (
    <div className="rounded-2xl bg-[#0F172A]/90 px-3.5 py-2.5 text-xs text-white shadow-xl ring-1 ring-white/15 backdrop-blur-md">
      <p className="mb-1 font-extrabold tracking-tight">{label}</p>
      {payload.map((e) => {
        const name = e.name ?? '';
        const raw = e.value;
        const pretty = name === 'Vacancia'
          ? `${Number(raw ?? 0).toFixed(1)}%`
          : formatAreaM2(Number(raw ?? 0));
        return (
          <p key={name} className="flex items-center gap-1.5 font-semibold">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: e.color ?? '#fff' }} />
            {name}: <span className="font-extrabold">{pretty}</span>
          </p>
        );
      })}
    </div>
  );
}

function ChartLegend({ payload }: { payload?: Array<{ value?: string; color?: string }> }): React.JSX.Element {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-1 text-xs font-bold text-slate-600">
      {(payload ?? []).map((e) => (
        <span key={e.value} className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-md" style={{ background: e.color }} />
          {e.value}
        </span>
      ))}
    </div>
  );
}

function SparkTip({ active, payload }: { active?: boolean; payload?: readonly unknown[] }): React.JSX.Element | null {
  const first = (payload?.[0] ?? null) as { value?: number | string; payload?: { name?: string } } | null;
  if (active !== true || first === null) return null;
  return (
    <span className="rounded-xl bg-[#0F172A]/90 px-2.5 py-1 text-[11px] font-bold text-white">
      {String(first.payload?.name ?? '')}: ${Number(first.value ?? 0).toFixed(2)} USD/m²
    </span>
  );
}

export function Dashboard({
  periods, activePeriodId, onPeriod, live, frozen, currency, readOnly, fx, pendingCount, onGoValidation,
}: Props): React.JSX.Element {
  const isQ1 = activePeriodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const deltas = kpiDeltas(live, frozen.vacancyPct, frozen.avgRentUsd);
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);

  const leasedM2 = kpis.totalInventoryM2 - kpis.corridors.reduce((s, c) => s + c.vacantM2, 0);
  const leasedPct = kpis.totalInventoryM2 > 0 ? (leasedM2 / kpis.totalInventoryM2) * 100 : 0;

  const chartData = kpis.corridors.map((c) => ({
    corridor: c.corridor,
    Inventario: Math.round(c.inventoryM2),
    Vacancia: c.vacancyPct,
    Absorción: c.netAbsorptionM2,
  }));
  const maxInv = Math.max(1, ...chartData.map((d) => d.Inventario));

  const sparkData = kpis.corridors
    .filter((c) => c.avgRentUsd !== null)
    .map((c) => ({ name: c.corridor.split(' ')[0], renta: c.avgRentUsd ?? 0 }));

  const topAbsorption = [...kpis.corridors].sort((a, b) => b.netAbsorptionM2 - a.netAbsorptionM2)[0];
  const topVacancy = [...kpis.corridors].filter((c) => c.inventoryM2 > 0).sort((a, b) => b.vacancyPct - a.vacancyPct)[0];

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Greeting header */}
      <div className="col-span-12 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-[1.7rem]">
            Bienvenido, Mercado Industrial Jalisco
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Compara el trimestre congelado Q1 con el Q2 en vivo · pasa el cursor sobre los subtítulos para entender cada métrica
          </p>
        </div>
        <span
          className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200"
          title="Tipo de cambio Banxico del periodo activo, usado para convertir rentas USD ↔ MXN"
        >
          USD/MXN <b className="text-[#0F172A]">${fx.toFixed(2)}</b> · Banxico
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-white p-1 ring-1 ring-slate-200">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriod(p.id)}
              title={p.isClosed ? 'Trimestre cerrado: cifras inmutables para auditoría' : 'Trimestre activo: se recalcula al aprobar propiedades'}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activePeriodId === p.id ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F172A]'
              }`}
            >
              {p.label} {p.isClosed ? '· cerrado' : '· en vivo'}
            </button>
          ))}
        </div>
        {readOnly && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            Solo lectura · datos verificados y anonimizados
          </span>
        )}
      </div>

      {/* Vacancy radial meter */}
      <div className={`${bentoCard} col-span-12 sm:col-span-6 xl:col-span-4`}>
        <MeterLabel icon={PieChart} iconCls="bg-amber-50 text-amber-500" title="Vacancia" subtitle="% del inventario disponible para renta" />
        <div className="mt-2">
          <RadialRing pct={kpis.vacancyPct} />
        </div>
        <div className="mt-2 text-center">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${toneCls[isQ1 ? 'neutral' : deltas.vacancy.good ? 'good' : 'bad']}`}>
            {isQ1 ? 'Trimestre congelado' : deltas.vacancy.label}
          </span>
        </div>
      </div>

      {/* Inventory striped meter */}
      <div className={`${bentoCard} col-span-12 sm:col-span-6 xl:col-span-4`}>
        <MeterLabel icon={Building2} iconCls="bg-blue-50 text-brand-blue" title="Inventario total" subtitle="Espacio construido verificado en parques" />
        <p className="mt-3 text-3xl font-black tracking-tight text-[#0F172A]">{formatAreaM2(kpis.totalInventoryM2)}</p>
        <div
          className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-100"
          title={`${formatAreaM2(leasedM2)} ocupados · ${formatAreaM2(kpis.totalInventoryM2 - leasedM2)} disponibles`}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${leasedPct.toFixed(1)}%`,
              background: 'repeating-linear-gradient(135deg,#10B981 0 8px,#0B9E6E 8px 16px)',
            }}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-slate-600">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Ocupado {formatPct(leasedPct)}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" /> Disponible {formatPct(100 - leasedPct)}
          </span>
        </div>
        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${toneCls[isQ1 ? 'neutral' : 'good']}`}>
          {isQ1 ? 'Trimestre congelado' : `vs Q1 +${formatAreaM2(live.totalInventoryM2 - frozen.totalInventoryM2)}`}
        </span>
      </div>

      {/* Rent + sparkline */}
      <div className={`${bentoCard} col-span-12 xl:col-span-4`}>
        <MeterLabel icon={DollarSign} iconCls="bg-violet-50 text-violet-600" title={`Renta prom. (${currency})`} subtitle="Precio pedido ponderado por m² rentable" />
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-black tracking-tight text-[#0F172A]">{rent}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400" title="Equivalencia con el tipo de cambio Banxico del periodo">
              {currency === 'USD' ? formatMxnM2(kpis.avgRentMxn) : formatUsdM2(kpis.avgRentUsd)} equiv.
            </p>
          </div>
          <div className="h-16 w-36 shrink-0" title="Renta promedio USD/m² por corredor">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sparkGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip content={<SparkTip />} />
                <Area type="monotone" dataKey="renta" stroke="#F59E0B" strokeWidth={2.5} fill="url(#sparkGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${toneCls[isQ1 ? 'neutral' : deltas.rent.good ? 'good' : 'bad']}`}>
          {isQ1 ? 'Ponderada por m² rentable' : deltas.rent.label}
        </span>
      </div>

      {/* Absorption mini strip */}
      <div className={`${bentoCard} col-span-12 flex flex-wrap items-center gap-x-8 gap-y-3 sm:col-span-6`}>
        <MeterLabel icon={TrendingUp} iconCls="bg-emerald-50 text-emerald-600" title="Absorción neta" subtitle="Cambio neto de ocupación vs Q1" />
        <p className="ml-auto text-2xl font-black tracking-tight text-[#0F172A]">{formatAreaM2(kpis.netAbsorptionM2)}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${toneCls[isQ1 ? 'neutral' : kpis.netAbsorptionM2 >= 0 ? 'good' : 'bad']}`}>
          {isQ1 ? 'Trimestre congelado' : 'Ocupado(Q2) − Ocupado(Q1)'}
        </span>
      </div>
      <div className={`${bentoCard} col-span-12 flex flex-wrap items-center gap-x-8 gap-y-3 sm:col-span-6`}>
        <MeterLabel icon={TrendingDown} iconCls="bg-emerald-50 text-emerald-600" title="Absorción bruta" subtitle="Espacio colocado nuevo en el trimestre" />
        <p className="ml-auto text-2xl font-black tracking-tight text-[#0F172A]">{formatAreaM2(kpis.grossAbsorptionM2)}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${toneCls[isQ1 ? 'neutral' : 'good']}`}>
          {isQ1 ? 'Trimestre congelado' : 'Leasing nuevo del periodo'}
        </span>
      </div>

      {/* Chart */}
      <div className={`${bentoCard} col-span-12 xl:col-span-8`}>
        <h3 className="text-sm font-extrabold tracking-tight text-[#0F172A]">
          Inventario y vacancia por corredor · {isQ1 ? '2026-Q1 (cerrado)' : '2026-Q2 (activo, recalculado en vivo)'}
        </h3>
        <p className="mb-3 mt-0.5 text-xs text-slate-500">
          Barras = inventario (m²) · línea dorada = vacancia % · la línea punteada marca el cero
        </p>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 52 }}>
              <defs>
                <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="gradAbs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="corridor" interval={0} angle={-10} textAnchor="end" height={56}
                tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false}
              />
              <YAxis
                yAxisId="left" domain={[0, Math.ceil(maxInv * 1.15)]}
                tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <YAxis
                yAxisId="right" orientation="right" domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#F1F5F9', opacity: 0.7 }} />
              <Legend content={<ChartLegend />} />
              <ReferenceLine yAxisId="left" y={0} stroke="#0F172A" strokeOpacity={0.4} strokeDasharray="5 4" />
              <ReferenceLine yAxisId="right" y={0} stroke="#0F172A" strokeOpacity={0.25} strokeDasharray="5 4" />
              <Bar yAxisId="left" dataKey="Inventario" fill="url(#gradInv)" radius={[12, 12, 12, 12]} maxBarSize={38} />
              <Bar yAxisId="left" dataKey="Absorción" fill="url(#gradAbs)" radius={[12, 12, 12, 12]} maxBarSize={38} />
              <Line yAxisId="right" type="monotone" dataKey="Vacancia" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dark executive highlight */}
      <div className="relative col-span-12 overflow-hidden rounded-[2.2rem] border border-slate-700/60 bg-[#0F172A]/95 p-6 text-white shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl xl:col-span-4">
        <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#FACC15]/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-brand-blue/20 blur-2xl" />
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#FACC15]">
          <Sparkles size={13} /> Lectura ejecutiva
        </p>
        <p className="mt-3 text-xl font-extrabold leading-snug tracking-tight">
          {topAbsorption !== undefined
            ? `${topAbsorption.corridor} lidera con ${formatAreaM2(topAbsorption.netAbsorptionM2)} de absorción neta`
            : 'Sin datos de absorción en el periodo'}
        </p>
        <ul className="mt-4 space-y-2 text-[13px] leading-snug text-slate-300">
          <li className="flex gap-2">
            <span className="mt-0.5 rounded-full bg-[#FACC15] px-2 py-0.5 text-[10px] font-black text-slate-900">VACANCIA</span>
            {topVacancy !== undefined && topVacancy.inventoryM2 > 0
              ? `Mayor vacancia en ${topVacancy.corridor} (${formatPct(topVacancy.vacancyPct)}). Renta prom. ${formatUsdM2(kpis.avgRentUsd)}.`
              : 'Sin inventario registrado en este corte.'}
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 rounded-full bg-[#FACC15] px-2 py-0.5 text-[10px] font-black text-slate-900">SNAPSHOT</span>
            {isQ1 ? 'Q1 congelado: cifras inmutables listas para auditoría.' : 'Q2 en vivo: cada aprobación recalcula al instante.'}
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 rounded-full bg-[#FACC15] px-2 py-0.5 text-[10px] font-black text-slate-900">PIPELINE</span>
            {pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'propiedad pendiente' : 'propiedades pendientes'} de validación.` : 'Sin pendientes de validación.'}
          </li>
        </ul>
        <button
          type="button"
          onClick={onGoValidation}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FACC15] px-4 py-2.5 text-xs font-black text-slate-900 shadow-[0_0_22px_rgba(250,204,21,0.35)] transition-all duration-200 hover:shadow-[0_0_30px_rgba(250,204,21,0.55)]"
        >
          {pendingCount > 0 ? 'Aprobar nave pendiente' : 'Ver validación'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
