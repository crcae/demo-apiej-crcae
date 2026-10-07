import { useEffect } from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { QUARTER_MONTHS } from '../../mock/market.mock.js';
import type { MarketKpis, Period } from '../../types/domain.js';
import { formatAreaM2, formatMxnM2, formatPct, formatUsdM2 } from '../../utils/formatters.js';

export type Currency = 'USD' | 'MXN';

interface Props {
  periods: Period[];
  activePeriodId: string;
  onPeriod: (id: string) => void;
  live: MarketKpis;      // Q2+ computed live (recalculates on approval)
  frozen: MarketKpis;    // Q1 frozen seed
  currency: Currency;
  onCurrency: (c: Currency) => void;
  readOnly: boolean;
  fx: number;
  fxLive: boolean;
  onRevalidateFx: () => void;
  pendingCount: number;
  onGoValidation: () => void;
  onExport: () => void;
  onOpenTour: () => void;
}

const card =
  'rounded-3xl bg-[#EBF0F5] p-5 shadow-[8px_8px_18px_#c5ccd6,-8px_-8px_18px_#ffffff] transition-all duration-300 hover:shadow-[10px_10px_22px_#c5ccd6,-10px_-10px_22px_#ffffff]';

/** Donut progress ring (vacancy accent). */
function DonutRing({ pct }: { pct: number }): React.JSX.Element {
  const r = 54;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative h-32 w-32 shrink-0" title={`${clamped.toFixed(1)} de cada 100 m² disponible para renta`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="vacRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8d00" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#E2E8F0" strokeWidth="13" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="url(#vacRing)" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black tracking-tight text-slate-950">{formatPct(clamped)}</span>
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
    <div className="rounded-2xl bg-[#0F172A] px-3.5 py-2.5 text-xs text-white shadow-xl ring-1 ring-white/15">
      <p className="mb-1 font-extrabold tracking-tight">{label}</p>
      {payload.map((e) => (
        <p key={e.name} className="flex items-center gap-1.5 font-semibold">
          <i className="inline-block h-2 w-2 rounded-full" style={{ background: e.color ?? '#fff' }} />
          {e.name}: <span className="font-extrabold">{formatAreaM2(Number(e.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

export function Dashboard({
  periods, activePeriodId, onPeriod, live, frozen, currency, onCurrency, readOnly, fx, fxLive, onRevalidateFx, pendingCount, onGoValidation, onExport, onOpenTour,
}: Props): React.JSX.Element {
  // Revalidate the live FX rate when the period or currency changes so all
  // dependent $/m² figures update in real time (frozen fallback always safe).
  useEffect(() => {
    onRevalidateFx();
  }, [activePeriodId, currency, onRevalidateFx]);

  const activePeriod = periods.find((p) => p.id === activePeriodId);
  const isQ1 = activePeriodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const occupiedPct = 100 - kpis.vacancyPct;
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);

  const chartData = kpis.corridors.map((c) => ({
    corridor: c.corridor,
    Total: Math.round(c.inventoryM2),
    Disponible: Math.round(c.vacantM2),
  }));

  const periodStatus = activePeriod?.isClosed === true
    ? 'Cerrado'
    : activePeriod?.quarter === 4 ? 'Actual' : activePeriod?.quarter === 3 ? 'Planificado' : 'En vivo';
  const periodMonths = activePeriod !== undefined ? QUARTER_MONTHS[activePeriod.quarter] ?? '' : '';

  return (
    <div>
      {/* Header */}
      <p className="text-xs font-medium text-slate-500">Panel / Dashboard</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">
            Panorama del mercado industrial
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Inventario, disponibilidad y actividad en Jalisco.
          </p>
        </div>
        <span
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm"
          title={fxLive ? 'Tipo de cambio EN VIVO (mercado abierto)' : 'Tipo de cambio Banxico congelado del periodo'}
        >
          USD/MXN {fx.toFixed(fxLive ? 4 : 2)}
          <i className={`inline-block h-2 w-2 rounded-full ${fxLive ? 'animate-pulse bg-[#ff8d00]' : 'bg-slate-400'}`} />
          {fxLive ? 'LIVE' : ''}
        </span>
        <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
          Trimestre actual: Q4 2026
        </span>
        <span className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
          Hoy: 1 oct 2026
        </span>
      </div>
      {readOnly && (
        <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
          Solo lectura · datos verificados y anonimizados
        </p>
      )}

      {/* Toolbar — single Tour button lives here */}
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/50 bg-slate-100/50 p-2">
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/60 bg-[#EBF0F5] p-1 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
          <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Periodo consultado
          </span>
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriod(p.id)}
              title={p.isClosed ? 'Trimestre cerrado: cifras inmutables para auditoría' : 'Trimestre en vivo: se recalcula al aprobar propiedades'}
              className={`px-4 py-1.5 text-xs transition-all duration-200 ${
                activePeriodId === p.id
                  ? 'rounded-xl bg-[#ff9100] font-black text-white shadow-sm'
                  : 'cursor-pointer rounded-xl font-semibold text-slate-600 hover:text-slate-900'
              }`}
            >
              Q{p.quarter} {p.year}
            </button>
          ))}
          <span className="ml-2 mr-3 text-xs font-medium text-slate-400">
            {periodStatus} · {periodMonths.replace(' - ', '—')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-2xl border border-white/60 bg-[#EBF0F5] p-1 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]"
            title="Precios en dólares o pesos (tipo de cambio del periodo)"
          >
            {(['USD', 'MXN'] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCurrency(c)}
                className={`px-3.5 py-1.5 text-xs transition-all duration-200 ${
                  currency === c
                    ? 'rounded-xl bg-[#00a2ff] font-bold text-white shadow-sm'
                    : 'cursor-pointer rounded-xl font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenTour}
            title="Inicia el tour guiado de 5 pasos"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50"
          >
            📖 Tour guiado
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Vista previa del Reporte Trimestral oficial + descarga PDF"
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#b3d700] px-4 py-1.5 text-xs font-black text-slate-950 shadow-md transition-all hover:bg-[#a2c400]"
          >
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-12 gap-5">
        <div className={`${card} col-span-12 sm:col-span-6 xl:col-span-4`}>
          <span className="mb-2 inline-block rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600">🏢</span>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Superficie industrial total</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{formatAreaM2(kpis.totalInventoryM2)}</p>
          <p className="mb-3 mt-0.5 text-xs font-medium text-slate-500">Espacio construido registrado en los parques.</p>
          <div
            className="flex h-3 overflow-hidden rounded-full bg-[#E2E8F0] shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]"
            title={`Ocupado ${formatPct(occupiedPct)} · Disponible ${formatPct(kpis.vacancyPct)}`}
          >
            <div className="h-full bg-[#10b981] transition-all duration-700" style={{ width: `${occupiedPct.toFixed(1)}%` }} />
            <div className="h-full bg-[#f59e0b] transition-all duration-700" style={{ width: `${kpis.vacancyPct.toFixed(1)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>🟢 Ocupado {formatPct(occupiedPct)} · 🟠 Disponible {formatPct(kpis.vacancyPct)}</span>
            <span className="rounded-md bg-slate-200/70 px-2 py-0.5">Inventario</span>
          </div>
        </div>

        <div className={`${card} col-span-12 sm:col-span-6 xl:col-span-4`}>
          <span className="mb-2 inline-block rounded-xl bg-amber-500/15 p-2.5 text-amber-600">⏱</span>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Espacio disponible para renta</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-black tracking-tight text-slate-950">{formatPct(kpis.vacancyPct)}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Parte del inventario disponible para renta.</p>
            </div>
            <DonutRing pct={kpis.vacancyPct} />
          </div>
          <span className="mt-3 inline-block rounded-md bg-slate-200/60 px-2.5 py-1 text-[10px] font-medium text-slate-600">
            {kpis.vacancyPct.toFixed(1)} de cada 100 m² · Vacancia
          </span>
        </div>

        <div className={`${card} col-span-12 xl:col-span-4`}>
          <span className="mb-2 inline-block rounded-xl bg-blue-500/15 p-2.5 text-blue-600">$</span>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Renta promedio por m²</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{rent}</p>
          <p className="mb-3 mt-1 text-xs font-medium text-slate-500">Precio solicitado, ponderado por superficie rentable.</p>
          <span className="inline-block rounded-md bg-slate-200/60 px-2.5 py-1 text-[10px] font-medium text-slate-600">
            Moneda seleccionada: {currency}
          </span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className={`${card} flex items-center justify-between gap-4`}>
          <div className="flex items-center">
            <span className="mr-3 rounded-2xl bg-emerald-500/15 p-3 text-emerald-600">📈</span>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Cambio neto de ocupación (Absorción neta)</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Aumento del espacio ocupado respecto al trimestre anterior.</p>
            </div>
          </div>
          <p className="shrink-0 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">+{formatAreaM2(kpis.netAbsorptionM2)}</p>
        </div>
        <div className={`${card} flex items-center justify-between gap-4`}>
          <div className="flex items-center">
            <span className="mr-3 rounded-2xl bg-blue-500/15 p-3 text-blue-600">📊</span>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Superficie comercializada (Absorción bruta)</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Superficie de operaciones registradas en el trimestre.</p>
            </div>
          </div>
          <p className="shrink-0 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{formatAreaM2(kpis.grossAbsorptionM2)}</p>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`${card} col-span-1 lg:col-span-8`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Superficie total y disponible por corredor</h3>
              <p className="text-xs font-medium text-slate-500">{activePeriod?.label ?? ''} · Esquema visual sin escala</p>
            </div>
            <div className="flex gap-4 text-[11px] font-bold text-slate-700">
              <span>⚫ Superficie total</span>
              <span>🟢 Disponible</span>
            </div>
          </div>
          <div className="mt-2 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 52 }} barGap={6}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="corridor" interval={0} angle={-10} textAnchor="end" height={56}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#E2E8F0', opacity: 0.6 }} />
                <Bar dataKey="Total" fill="#0F172A" radius={[10, 10, 10, 10]} maxBarSize={38} />
                <Bar dataKey="Disponible" fill="#b3d700" radius={[10, 10, 10, 10]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${card} col-span-1 flex flex-col justify-between lg:col-span-4`}>
          <div>
            <h3 className="mb-4 text-base font-black text-slate-950">Claves del trimestre</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#ff8d00]/15 p-2.5 text-[#ff8d00]">🟠</span>
                <p className="text-xs font-medium text-slate-500">
                  <b className="mr-1 font-extrabold text-slate-950">{formatPct(kpis.vacancyPct)}</b>disponible para renta
                </p>
              </li>
              <li className="flex items-center gap-3">
                <span className="rounded-2xl bg-emerald-500/15 p-2.5 text-emerald-600">📈</span>
                <p className="text-xs font-medium text-slate-500">
                  <b className="mr-1 font-extrabold text-slate-950">{formatAreaM2(kpis.netAbsorptionM2)}</b>de aumento neto
                </p>
              </li>
              <li className="flex items-center gap-3">
                <span className="rounded-2xl bg-blue-500/15 p-2.5 text-blue-600">📋</span>
                <p className="text-xs font-medium text-slate-500">
                  <b className="mr-1 font-extrabold text-slate-950">{pendingCount}</b>registros por validar
                </p>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onGoValidation}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#b3d700] py-3 text-xs font-black text-slate-950 shadow-md transition-all hover:bg-[#a2c400]"
          >
            Revisar pendientes ➔
          </button>
        </div>
      </div>
    </div>
  );
}
