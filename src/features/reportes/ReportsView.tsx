import { useRef, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { Currency } from '../dashboard/Dashboard.js';
import type { MarketKpis, Period } from '../../types/domain.js';
import { mockMarketReportDemo, type ParkCapitalBlock } from '../../mock/marketReport.mock.js';
import { PageHeader } from '../../components/PageHeader.js';
import { downloadElementAsPdf } from '../../services/pdfReport.js';
import { formatAreaM2, formatMxnM2, formatPct, formatUsdM2 } from '../../utils/formatters.js';

type ReportKind = 'executive' | 'observatory';

interface Props {
  periods: Period[];
  live: MarketKpis;
  frozen: MarketKpis;
  currency: Currency;
  fx: number;
  generatedBy: string;
}

const GALLERY: Array<{ id: ReportKind; title: string; period: string; blurb: string; badge: string }> = [
  {
    id: 'executive',
    title: 'Resumen ejecutivo trimestral',
    period: 'Q1 / Q2 2026',
    blurb: 'KPIs congelados y en vivo del observatorio — inventario, vacancia y absorción.',
    badge: 'Ejecutivo',
  },
  {
    id: 'observatory',
    title: 'Resumen de Mercado Industrial',
    period: mockMarketReportDemo.periodLabel,
    blurb: 'Estructura PCI / PCP por corredor ZMG · Observatorio APIEJ.',
    badge: 'PCI · PCP',
  },
];

export function ReportsView({ periods, live, frozen, currency, fx, generatedBy }: Props): React.JSX.Element {
  const [kind, setKind] = useState<ReportKind>('executive');
  const [periodId, setPeriodId] = useState(live.periodId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const execRef = useRef<HTMLDivElement | null>(null);
  const obsRef = useRef<HTMLDivElement | null>(null);

  const isQ1 = periodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const period = periods.find((p) => p.id === periodId);
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);
  const vacDelta = (live.vacancyPct - frozen.vacancyPct).toFixed(1);
  const label = period?.label ?? '2026-Q2';
  const report = mockMarketReportDemo;

  async function handleDownload(): Promise<void> {
    const el = kind === 'executive' ? execRef.current : obsRef.current;
    if (el === null) return;
    setBusy(true);
    setErr(null);
    const file =
      kind === 'executive'
        ? `APIEJ-Resumen-Ejecutivo-${label}.pdf`
        : `APIEJ-Observatorio-Mercado-${report.periodLabel}.pdf`;
    try {
      await downloadElementAsPdf(el, file);
    } catch {
      setErr('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        section="Reportes"
        title="Reportes de mercado"
        subtitle="Dos plantillas descargables · look editorial para socios APIEJ."
        actions={(
          <button
            type="button"
            disabled={busy}
            onClick={() => { void handleDownload(); }}
            className="flex items-center gap-2 rounded-xl bg-[#0E1A3D] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#152552] disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Descargar PDF activo
          </button>
        )}
      />
      {err !== null && <p className="mt-3 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-600">{err}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {GALLERY.map((g) => {
          const active = kind === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setKind(g.id)}
              className={`group relative overflow-hidden rounded-2xl border text-left transition ${
                active
                  ? 'border-[#4A6CFF] bg-white shadow-lg ring-2 ring-[#4A6CFF]/30'
                  : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="flex h-28 items-end bg-gradient-to-br from-[#0E1A3D] via-[#152552] to-[#1a3060] p-4">
                <div className="flex h-[3px] w-24 gap-0.5" aria-hidden="true">
                  <span className="flex-1 rounded-full bg-[#FF7A00]" />
                  <span className="flex-1 rounded-full bg-[#10B981]" />
                  <span className="flex-1 rounded-full bg-[#4A6CFF]" />
                </div>
                <FileText className="absolute right-4 top-4 text-white/20" size={48} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#4A6CFF]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#4A6CFF]">
                    {g.badge}
                  </span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#4A6CFF]">Activo</span>
                  )}
                </div>
                <p className="mt-2 font-display text-lg font-extrabold text-[#0E1A3D]">{g.title}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-400">{g.period}</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{g.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      {kind === 'executive' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
          >
            {periods.filter((p) => p.quarter <= 2).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}{p.isClosed ? ' · cerrado' : ' · en vivo'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-slate-200/50 p-4 shadow-inner">
        {kind === 'executive' ? (
          <div
            ref={execRef}
            id="quarterly-report"
            className="mx-auto w-full max-w-[794px] overflow-hidden bg-white text-[#0E1A3D] shadow-xl"
          >
            <div className="bg-[#0E1A3D] px-10 py-8 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7DD3FC]">APIEJ · Observatorio Industrial</p>
                  <h3 className="mt-2 font-display text-2xl font-black tracking-tight">Resumen de Mercado Industrial</h3>
                  <p className="mt-1 text-sm font-semibold text-white/75">Jalisco · {label} · Zona Metropolitana de Guadalajara</p>
                </div>
                <img src="/apiej_logo.png" alt="" className="h-12 w-auto object-contain brightness-0 invert" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { k: 'Inventario', v: formatAreaM2(kpis.totalInventoryM2) },
                  { k: 'Vacancia', v: formatPct(kpis.vacancyPct) },
                  { k: 'Renta promedio', v: rent },
                ].map((x) => (
                  <div key={x.k} className="rounded-xl bg-white/10 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">{x.k}</p>
                    <p className="mt-1 text-lg font-black">{x.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-10 py-8">
              <h4 className="text-sm font-black uppercase tracking-wider text-[#0E1A3D]">Lectura ejecutiva</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                El inventario industrial monitoreado por APIEJ alcanza <b>{formatAreaM2(kpis.totalInventoryM2)}</b> con
                una vacancia de <b>{formatPct(kpis.vacancyPct)}</b>
                {!isQ1 && <> ({Number(vacDelta) > 0 ? '+' : ''}{vacDelta} pp vs Q1)</>}
                , absorción neta de <b>{formatAreaM2(kpis.netAbsorptionM2)}</b> y renta promedio de <b>{rent}</b>.
                Tipo de cambio de referencia: <b>{fx.toFixed(2)} MXN/USD</b>.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Absorción neta</p>
                  <p className="mt-1 text-xl font-black text-emerald-700">{formatAreaM2(kpis.netAbsorptionM2)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Absorción bruta</p>
                  <p className="mt-1 text-xl font-black text-[#4A6CFF]">{formatAreaM2(kpis.grossAbsorptionM2)}</p>
                </div>
              </div>

              <h4 className="mt-8 text-sm font-black uppercase tracking-wider text-[#0E1A3D]">Desempeño por corredor</h4>
              <table className="mt-3 w-full overflow-hidden rounded-xl text-sm ring-1 ring-slate-200">
                <thead>
                  <tr className="bg-[#0E1A3D] text-left text-[10px] uppercase tracking-wider text-white">
                    <th className="px-3 py-2.5">Corredor</th>
                    <th className="px-3 py-2.5 text-right">Inventario</th>
                    <th className="px-3 py-2.5 text-right">Vacancia</th>
                    <th className="px-3 py-2.5 text-right">Abs. neta</th>
                    <th className="px-3 py-2.5 text-right">USD/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.corridors.map((c, i) => (
                    <tr key={c.corridor} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-bold">{c.corridor}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatAreaM2(c.inventoryM2)}</td>
                      <td className="px-3 py-2 text-right font-bold">{formatPct(c.vacancyPct)}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{formatAreaM2(c.netAbsorptionM2)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatUsdM2(c.avgRentUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 rounded-xl border border-[#4A6CFF]/20 bg-[#4A6CFF]/5 p-4 text-xs leading-relaxed text-slate-600">
                <p className="font-extrabold text-[#0E1A3D]">Nota metodológica</p>
                <p className="mt-1">
                  Cifras del Observatorio APIEJ. Q1 permanece congelado para auditoría; trimestres abiertos
                  se recalculan al verificar inventario. Documento generado para socios y tomadores de decisión.
                </p>
              </div>

              <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
                <p>Generado por {generatedBy} · {new Date().toLocaleString('es-MX')}</p>
                <p className="font-bold text-[#0E1A3D]">APIEJ — Una sola fuente de verdad</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={obsRef}
            id="observatory-report"
            className="mx-auto w-full max-w-[794px] overflow-hidden bg-white text-[#0E1A3D] shadow-xl"
          >
            {/* Cover */}
            <div className="bg-[#0E1A3D] px-10 py-10 text-white">
              <div className="flex h-1 w-full overflow-hidden rounded-full">
                <span className="flex-1 bg-[#FF7A00]" />
                <span className="flex-1 bg-[#10B981]" />
                <span className="flex-1 bg-[#4A6CFF]" />
              </div>
              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7DD3FC]">
                    Observatorio APIEJ
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-black tracking-tight">{report.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/75">{report.subtitle}</p>
                  <p className="mt-3 text-xs font-medium text-white/55">Periodo · {report.periodLabel} · ZMG</p>
                </div>
                <img src="/apiej_logo.png" alt="" className="h-14 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="mt-6 text-xs leading-relaxed text-white/70">{report.coverageNote}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {report.corridorsCovered.map((c) => (
                  <span key={c} className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/85">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-10 py-8">
              <CapitalBlock block={report.pci} accent="#4A6CFF" />
              <CapitalBlock block={report.pcp} accent="#10B981" />

              <h4 className="mt-8 text-sm font-black uppercase tracking-wider text-[#0E1A3D]">
                Comparativa nacional ilustrativa
              </h4>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Comparativa nacional · TC ref. {report.fxUsdMxn.toFixed(2)} MXN/USD
              </p>
              <table className="mt-3 w-full overflow-hidden rounded-xl text-sm ring-1 ring-slate-200">
                <thead>
                  <tr className="bg-[#0E1A3D] text-left text-[10px] uppercase tracking-wider text-white">
                    <th className="px-3 py-2.5">Mercado</th>
                    <th className="px-3 py-2.5 text-right">Abs. neta</th>
                    <th className="px-3 py-2.5 text-right">Disp.</th>
                    <th className="px-3 py-2.5 text-right">USD/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {report.national.map((r, i) => (
                    <tr key={r.market} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-bold">{r.market}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatAreaM2(r.netAbsorptionM2)}</td>
                      <td className="px-3 py-2 text-right font-bold">{formatPct(r.availabilityPct)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatUsdM2(r.avgRentUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 className="mt-8 text-sm font-black uppercase tracking-wider text-[#0E1A3D]">Totales ZMG</h4>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { k: 'Inventario', v: formatAreaM2(report.zmgTotals.inventoryM2) },
                  { k: 'En construcción', v: formatAreaM2(report.zmgTotals.underConstructionM2) },
                  { k: 'Disponibilidad', v: formatPct(report.zmgTotals.availabilityPct) },
                  { k: 'Renta avg', v: formatUsdM2(report.zmgTotals.avgRentUsd) },
                ].map((x) => (
                  <div key={x.k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{x.k}</p>
                    <p className="mt-1 text-sm font-black text-[#0E1A3D]">{x.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
                <p className="font-extrabold">Aviso</p>
                <p className="mt-1">{report.disclaimer}</p>
              </div>

              <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
                <p>Generado por {generatedBy} · {new Date().toLocaleString('es-MX')}</p>
                <p className="font-bold text-[#0E1A3D]">APIEJ · Observatorio Industrial</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CapitalBlock({ block, accent }: { block: ParkCapitalBlock; accent: string }): React.JSX.Element {
  return (
    <section className="mt-6 first:mt-0">
      <div className="flex items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
          style={{ background: accent }}
        >
          {block.short}
        </span>
        <h4 className="text-sm font-black uppercase tracking-wider text-[#0E1A3D]">{block.label}</h4>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: 'Abs. bruta', v: formatAreaM2(block.grossAbsorptionM2) },
          { k: 'Abs. neta', v: formatAreaM2(block.netAbsorptionM2) },
          { k: 'Disponibilidad', v: formatPct(block.availabilityPct) },
          { k: 'Renta avg', v: formatUsdM2(block.avgRentUsd) },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{x.k}</p>
            <p className="mt-1 text-sm font-black" style={{ color: accent }}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <span className="font-bold text-slate-500">Desocupaciones </span>
          <span className="font-extrabold text-slate-800">{formatAreaM2(block.vacationsM2)}</span>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <span className="font-bold text-slate-500">Construcción </span>
          <span className="font-extrabold text-slate-800">{formatAreaM2(block.underConstructionM2)}</span>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <span className="font-bold text-slate-500">Crec. inv. </span>
          <span className="font-extrabold text-slate-800">{formatPct(block.inventoryGrowthPct)}</span>
        </div>
      </div>

      <table className="mt-3 w-full overflow-hidden rounded-xl text-[11px] ring-1 ring-slate-200">
        <thead>
          <tr className="bg-slate-800 text-left text-[9px] uppercase tracking-wider text-white">
            <th className="px-2.5 py-2">Corredor</th>
            <th className="px-2.5 py-2 text-right">Abs. neta</th>
            <th className="px-2.5 py-2 text-right">Disp. m²</th>
            <th className="px-2.5 py-2 text-right">USD/m²</th>
            <th className="px-2.5 py-2 text-right">Construcción</th>
          </tr>
        </thead>
        <tbody>
          {block.corridors.map((c, i) => (
            <tr key={c.corridor} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-2.5 py-1.5 font-bold">{c.corridor}</td>
              <td className="px-2.5 py-1.5 text-right text-emerald-700">{formatAreaM2(c.netAbsorptionM2)}</td>
              <td className="px-2.5 py-1.5 text-right text-slate-600">{formatAreaM2(c.availabilityM2)}</td>
              <td className="px-2.5 py-1.5 text-right text-slate-600">{formatUsdM2(c.avgRentUsd)}</td>
              <td className="px-2.5 py-1.5 text-right text-slate-600">{formatAreaM2(c.underConstructionM2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[10px] text-slate-400">
        Renta {formatUsdM2(block.minRentUsd)} – {formatUsdM2(block.maxRentUsd)} · prearrendado {formatAreaM2(block.preLeasedM2)}
      </p>
    </section>
  );
}
