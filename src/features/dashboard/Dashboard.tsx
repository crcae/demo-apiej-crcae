import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
}

function Kpi({ title, value, delta }: { title: string; value: string; delta?: string }): React.JSX.Element {
  return (
    <Card>
      <CardBody>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-[#0B192C]">{value}</p>
        {delta !== undefined && <p className="mt-1 text-xs font-semibold text-slate-500">{delta}</p>}
      </CardBody>
    </Card>
  );
}

export function Dashboard({ periods, activePeriodId, onPeriod, live, frozen, currency, onCurrency, readOnly }: Props): React.JSX.Element {
  const isQ1 = activePeriodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const deltas = kpiDeltas(live, frozen.vacancyPct, frozen.avgRentUsd);
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);

  const chartData = kpis.corridors.map((c) => ({
    corridor: c.corridor.split(' ')[0],
    Inventario: Math.round(c.inventoryM2),
    Vacancia: c.vacancyPct,
    Absorción: c.netAbsorptionM2,
  }));

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
        <div className="ml-auto flex items-center gap-1.5 rounded-xl bg-white p-1 ring-1 ring-slate-200">
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
        {readOnly && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
            Solo lectura · datos verificados anonimizados
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Inventario total" value={formatAreaM2(kpis.totalInventoryM2)} delta={isQ1 ? 'Trimestre congelado' : `vs Q1: +${formatAreaM2(live.totalInventoryM2 - frozen.totalInventoryM2)}`} />
        <Kpi title="Vacancia" value={formatPct(kpis.vacancyPct)} delta={isQ1 ? 'Trimestre congelado' : deltas.vacancy.label} />
        <Kpi title="Absorción neta" value={formatAreaM2(kpis.netAbsorptionM2)} delta={isQ1 ? 'Trimestre congelado' : 'Ocupado(Q2) − Ocupado(Q1)'} />
        <Kpi title="Absorción bruta" value={formatAreaM2(kpis.grossAbsorptionM2)} delta={isQ1 ? 'Trimestre congelado' : 'Leasing nuevo del periodo'} />
        <Kpi title={`Renta promedio (${currency})`} value={rent} delta={isQ1 ? 'Ponderada por m² rentable' : deltas.rent.label} />
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
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="corridor" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  formatter={(value, name) => {
                    const label = typeof name === 'string' ? name : '';
                    if (label === 'Vacancia') return [`${String(value)}%`, label];
                    return [formatAreaM2(Number(value ?? 0)), label];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Inventario" fill="#1E3E62" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="left" dataKey="Absorción" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Vacancia" stroke="#FF7A00" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
