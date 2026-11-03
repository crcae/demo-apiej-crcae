// Live USD/MXN rate with frozen-period fallback.
// Multi-source real-time fetcher (free, keyless):
//   Primary:  api.exchangerate-api.com/v4/latest/USD  -> rates.MXN
//   Fallback: jsdelivr fawazahmed0 currency-api        -> usd.mxn
// Never throws — returns null on any failure so the UI always falls back
// to the period's frozen Banxico rate. Rates rounded to 2 decimals.

export const FX_FALLBACK = 17.35;
export const FX_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const PRIMARY = 'https://api.exchangerate-api.com/v4/latest/USD';
const FALLBACK = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const TIMEOUT_MS = 8000;

/** How the effective FX was obtained for UI badges. */
export type FxSource = 'live' | 'frozen' | 'fallback' | 'error';

let cached: number | null = null;
let cachedAt = 0;
let inFlight: Promise<number | null> | null = null;

function validRate(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 10000) / 10000 : null;
}

function cacheFresh(): boolean {
  return cached !== null && Date.now() - cachedAt < FX_CACHE_TTL_MS;
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

async function fetchPrimary(signal: AbortSignal): Promise<number | null> {
  const body = (await getJson(PRIMARY, signal)) as { rates?: { MXN?: unknown } } | null;
  return body === null ? null : validRate(body.rates?.MXN);
}

async function fetchFallback(signal: AbortSignal): Promise<number | null> {
  const body = (await getJson(FALLBACK, signal)) as { usd?: { mxn?: unknown } } | null;
  return body === null ? null : validRate(body.usd?.mxn);
}

async function fetchOnce(signal: AbortSignal): Promise<number | null> {
  const primary = await fetchPrimary(signal).catch(() => null);
  if (primary !== null) return primary;
  return fetchFallback(signal).catch(() => null);
}

/** Clear in-memory FX cache (period change / manual revalidate). */
export function invalidateFxCache(): void {
  cached = null;
  cachedAt = 0;
}

/**
 * Fetch live USD→MXN. Cached for FX_CACHE_TTL_MS; concurrent callers share one request.
 * Pass `force: true` to bypass cache (manual revalidate).
 */
export function fetchLiveFxRate(opts?: { force?: boolean }): Promise<number | null> {
  if (opts?.force === true) invalidateFxCache();
  if (cacheFresh() && cached !== null) return Promise.resolve(cached);
  if (inFlight !== null) return inFlight;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  inFlight = fetchOnce(ctrl.signal)
    .then((rate) => {
      if (rate !== null) {
        cached = rate;
        cachedAt = Date.now();
      }
      return rate;
    })
    .catch(() => null)
    .finally(() => {
      window.clearTimeout(timer);
      inFlight = null;
    });
  return inFlight;
}

/** Resolve the effective rate: live override wins, otherwise the frozen period rate. */
export function resolveFx(live: number | null, frozen: number | undefined): number {
  return live ?? frozen ?? FX_FALLBACK;
}

/** Classify FX source for Dashboard badges. `fetchFailed` = last live attempt returned null. */
export function classifyFxSource(
  live: number | null,
  frozen: number | undefined,
  fetchFailed: boolean,
): FxSource {
  if (live !== null) return 'live';
  if (fetchFailed) return 'error';
  if (frozen !== undefined) return 'frozen';
  return 'fallback';
}
