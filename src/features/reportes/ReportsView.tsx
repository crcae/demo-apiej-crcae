import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { Currency } from '../dashboard/Dashboard.js';
import type { MarketKpis, Period } from '../../types/domain.js';
import { downloadElementAsPdf } from '../../services/pdfReport.js';
import { formatAreaM2, formatMxnM2, formatPct, formatUsdM2 } from '../../utils/formatters.js';

interface Props {
  periods: Period[];
  live: MarketKpis;
  frozen: MarketKpis;
  currency: Currency;
  fx: number;
  generatedBy: string;
}

export function ReportsView({ periods, live, frozen, currency, fx, generatedBy }: Props): React.JSX.Element {
  const [periodId, setPeriodId] = useState(live.periodId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const isQ1 = periodId === frozen.periodId;
  const kpis = isQ1 ? frozen : live;
  const period = periods.find((p) => p.id === periodId);
  const rent = currency === 'USD' ? formatUsdM2(kpis.avgRentUsd) : formatMxnM2(kpis.avgRentMxn);
  const vacDelta = (live.vacancyPct - frozen.vacancyPct).toFixed(1);
  const label = period?.label ?? '2026-Q2';

  async function handleDownload(): Promise<void> {
    if (sheetRef.current === null) return;
    setBusy(true);
    setErr(null);
    try {
      await downloadElementAsPdf(sheetRef.current, `APIEJ-Resumen-Mercado-${label}.pdf`);
    } catch {
      setErr('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-500">Panel / Reportes</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0E1A3D]">Reportes de mercado</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Resumen trimestral descargable para socios APIEJ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            disabled={busy}
            onClick={() => { void handleDownload(); }}
            className="flex items-center gap-2 rounded-xl bg-[#0E1A3D] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#152552] disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Descargar PDF
          </button>
        </div>
      </div>
      {err !== null && <p className="mt-3 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-600">{err}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-slate-200/50 p-4 shadow-inner">
        <div
          ref={sheetRef}
          id="quarterly-report"
          className="mx-auto w-full max-w-[794px] overflow-hidden bg-white text-[#0E1A3D] shadow-xl"
        >
          <div className="bg-[#0E1A3D] px-10 py-8 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7DD3FC]">APIEJ · Observatorio Industrial</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Resumen de Mercado Industrial</h3>
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
                Cifras demostrativas del Observatorio APIEJ. Q1 permanece congelado para auditoría; trimestres abiertos
                se recalculan al verificar inventario. Documento generado para socios y tomadores de decisión.
              </p>
            </div>

            <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
              <p>Generado por {generatedBy} · {new Date().toLocaleString('es-MX')}</p>
              <p className="font-bold text-[#0E1A3D]">APIEJ — Una sola fuente de verdad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
