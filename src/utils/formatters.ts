// Standard formatters per AGENTS.md: `$6.50 USD/m²`, `12,500 m²`.
const usdPerM2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const mxnPerM2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
const areaFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatUsdM2(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${usdPerM2.format(v)} USD/m²`;
}

export function formatMxnM2(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${mxnPerM2.format(v)} MXN/m²`;
}

export function formatAreaM2(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${areaFmt.format(v)} m²`;
}

export function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${pctFmt.format(v)}%`;
}

export function periodLabel(year: number, quarter: number): string {
  return `${year}-Q${quarter}`;
}
