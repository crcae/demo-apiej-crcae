import { Building2, DollarSign, FileDown, PieChart, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import {
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
import { Card, CardBody } from '../../components/ui/primitives.js';

export type Currency = 'USD' | 'MXN';

interface Props {
  periods: Period[];
  activePeriodId: string;
  onPeriod: (id: string) => void;
  live: MarketKpis;      // Q2 computed live (recalculates on approval)
  frozen: MarketKpis;    // Q1 frozen seed
  currency: Currency;
  onCurrency: (c: Currency) => void;
  readOnly: boolean;
  onExport: () => void;
}

type DeltaTone = 'good' | 'bad' | 'neutral';

const toneCls: Record<DeltaTone, string> = {
  good: 'bg-brand-emerald/10 text-emerald-700 ring-brand-emerald/20',
  bad: 'bg-red-50 text-red-600 ring-red-200',
  neutral: 'bg-slate-100 text-slate-500 ring-slate-200',
};

function Kpi({ title, value, delta, tone, icon: Icon }: {
  title: string;
  value: string;
  delta?: string;
  tone?: DeltaTone;
  icon: LucideIcon;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-slate-100/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-1.5">
        <Icon size={14} className="text-brand-blue" strokeWidth={2.5} />
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-[#0B192C]">{value}</p>
      {delta !== undefined && (
        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${toneCls[tone ?? 'neutral']}`}>
          {delta}
        </span>
      )}
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
    <div className="rounded-xl bg-[#0B192C] px-3 py-2 text-xs text-white shadow-xl ring-1 ring-white/10">
      <p className="mb-1 font-extrabold">{label}</p>
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
          <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />
          {e.value}
        </span>
      ))}
    </div>
  );
}

export function Dashboard({ periods, activePeriodId, onPeriod, live, frozen, currency, onCurrency, readOnly, onExport }: Props): React.JSX.Element {
  const isQ1 = activePeriodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const deltas = kpiDeltas(live, frozen.vacancyPct, frozen.avgRentUsd);
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);

  const chartData = kpis.corridors.map((c) => ({
    corridor: c.corridor,
    Inventario: Math.round(c.inventoryM2),
    Vacancia: c.vacancyPct,
    Absorción: c.netAbsorptionM2,
  }));
  const maxInv = Math.max(1, ...chartData.map((d) => d.Inventario));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriod(p.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activePeriodId === p.id
                  ? 'bg-[#0B192C] text-white shadow'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.label} {p.isClosed ? '· cerrado' : '· activo'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 ring-1 ring-slate-200">
            {(['USD', 'MXN'] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCurrency(c)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${currency === c ? 'bg-brand-blue text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-xl bg-[#0B192C] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E3E62]"
          >
            <FileDown size={14} /> Exportar Reporte PDF
          </button>
        </div>
        {readOnly && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            Solo lectura · datos verificados anonimizados
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          title="Inventario total" icon={Building2} value={formatAreaM2(kpis.totalInventoryM2)}
          delta={isQ1 ? 'Trimestre congelado' : `vs Q1 +${formatAreaM2(live.totalInventoryM2 - frozen.totalInventoryM2)}`}
          tone={isQ1 ? 'neutral' : 'good'}
        />
        <Kpi
          title="Vacancia" icon={PieChart} value={formatPct(kpis.vacancyPct)}
          delta={isQ1 ? 'Trimestre congelado' : deltas.vacancy.label}
          tone={isQ1 ? 'neutral' : deltas.vacancy.good ? 'good' : 'bad'}
        />
        <Kpi
          title="Absorción neta" icon={kpis.netAbsorptionM2 >= 0 ? TrendingUp : TrendingDown}
          value={formatAreaM2(kpis.netAbsorptionM2)}
          delta={isQ1 ? 'Trimestre congelado' : 'Ocupado(Q2) − Ocupado(Q1)'}
          tone={isQ1 ? 'neutral' : kpis.netAbsorptionM2 >= 0 ? 'good' : 'bad'}
        />
        <Kpi
          title="Absorción bruta" icon={TrendingUp} value={formatAreaM2(kpis.grossAbsorptionM2)}
          delta={isQ1 ? 'Trimestre congelado' : 'Leasing nuevo del periodo'}
          tone={isQ1 ? 'neutral' : 'good'}
        />
        <Kpi
          title={`Renta prom. (${currency})`} icon={DollarSign} value={rent}
          delta={isQ1 ? 'Ponderada por m² rentable' : deltas.rent.label}
          tone={isQ1 ? 'neutral' : deltas.rent.good ? 'good' : 'bad'}
        />
      </div>

      <Card>
        <CardBody>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B192C]">
              Inventario y vacancia por corredor · {isQ1 ? '2026-Q1 (cerrado)' : '2026-Q2 (activo, recalculado en vivo)'}
            </h3>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Barras = inventario (m²) · línea = vacancia % · {isQ1 ? 'snapshot inmutable' : 'se recalcula al aprobar naves en Validación'}
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 52 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="corridor" interval={0} angle={-10} textAnchor="end" height={56}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="left" domain={[0, Math.ceil(maxInv * 1.15)]}
                  tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <YAxis
                  yAxisId="right" orientation="right" domain={[0, 100]}
                  tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<ChartTip />} />
                <Legend content={<ChartLegend />} />
                <ReferenceLine yAxisId="left" y={0} stroke="#0B192C" strokeOpacity={0.35} />
                <Bar yAxisId="left" dataKey="Inventario" fill="#1E3E62" radius={[8, 8, 0, 0]} maxBarSize={44} />
                <Bar yAxisId="left" dataKey="Absorción" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={44} />
                <Line yAxisId="right" type="monotone" dataKey="Vacancia" stroke="#FF7A00" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
