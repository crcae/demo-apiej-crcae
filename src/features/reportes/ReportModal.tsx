import {X} from 'lucide-react';
import type { Currency } from '../dashboard/Dashboard.js';
import type { MarketKpis } from '../../types/domain.js';
import { formatAreaM2, formatMxnM2, formatPct, formatUsdM2 } from '../../utils/formatters.js';

interface Props {
  live: MarketKpis;
  frozen: MarketKpis;
  currency: Currency;
  fx: number;
  generatedBy: string;
  onClose: () => void;
}

export function ReportModal({ live, frozen, currency, fx, generatedBy, onClose }: Props): React.JSX.Element {
  const rent = currency === 'USD' ? formatUsdM2(live.avgRentUsd) : formatMxnM2(live.avgRentMxn);
  const vacDelta = (live.vacancyPct - frozen.vacancyPct).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/70 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Printable report */}
        <div id="exec-report" className="relative overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Watermark */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[120px] font-black tracking-tight text-[#0B192C]/5">
            APIEJ
          </span>
          <div className="relative border-b-4 border-brand-blue bg-[#0B192C] px-8 py-6 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">APIEJ · Inteligencia de Mercado Industrial</p>
            <h2 className="mt-1 text-2xl font-black">Reporte Trimestral Q2 2026 — Jalisco</h2>
            <p className="mt-1 text-xs text-slate-300">
              Fuente única de verdad · Snapshot Q1 congelado vs Q2 activo · Tipo de cambio Banxico ${fx.toFixed(2)} MXN/USD
            </p>
          </div>
          <div className="relative px-8 py-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0B192C]">Resumen ejecutivo</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El inventario industrial monitoreado alcanza <b>{formatAreaM2(live.totalInventoryM2)}</b> con una
              vacancia de <b>{formatPct(live.vacancyPct)}</b> ({Number(vacDelta) > 0 ? '+' : ''}{vacDelta} pp vs Q1),
              absorción neta de <b>{formatAreaM2(live.netAbsorptionM2)}</b> y renta promedio de <b>{rent}</b>.
              Las cifras Q2 se recalcularon en vivo tras la última validación; Q1 permanece inmutable para auditoría.
            </p>
            <h3 className="mt-6 text-sm font-extrabold uppercase tracking-wider text-[#0B192C]">Desempeño por corredor</h3>
            <table className="mt-2 w-full overflow-hidden rounded-xl text-sm ring-1 ring-slate-200">
              <thead>
                <tr className="bg-[#0B192C] text-left text-[11px] uppercase tracking-wider text-white">
                  <th className="px-3 py-2">Corredor</th>
                  <th className="px-3 py-2 text-right">Inventario</th>
                  <th className="px-3 py-2 text-right">Vacancia</th>
                  <th className="px-3 py-2 text-right">Abs. neta</th>
                  <th className="px-3 py-2 text-right">Renta USD/m²</th>
                </tr>
              </thead>
              <tbody>
                {live.corridors.map((c, i) => (
                  <tr key={c.corridor} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 font-bold text-slate-800">{c.corridor}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{formatAreaM2(c.inventoryM2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-800">{formatPct(c.vacancyPct)}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{formatAreaM2(c.netAbsorptionM2)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{formatUsdM2(c.avgRentUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex items-end justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-400">
              <p>Generado por {generatedBy} · {new Date().toLocaleString()} · Documento demostrativo</p>
              <p className="font-bold text-[#0B192C]">APIEJ — Una sola fuente de verdad</p>
            </div>
          </div>
        </div>
        {/* Actions (screen only) */}
        <div className="mt-3 flex justify-end gap-2 print:hidden">
          <button
            type="button" onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <X size={14} /> Cerrar
          </button>
          <button
            type="button" onClick={() => window.print()}
            className="rounded-xl bg-brand-emerald px-4 py-2 text-xs font-bold text-white shadow transition hover:opacity-90"
          >
            Descargar PDF (imprimir)
          </button>
        </div>
      </div>
    </div>
  );
}
