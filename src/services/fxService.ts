// Live USD/MXN rate with frozen-period fallback.
// Primary: open.er-api.com (free, no key). Never throws — returns null on any
// failure so the UI always falls back to the period's frozen Banxico rate.

export const FX_FALLBACK = 17.35;
const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const TIMEOUT_MS = 8000;

let cached: number | null = null;
let inFlight: Promise<number | null> | null = null;

async function fetchOnce(signal: AbortSignal): Promise<number | null> {
  const res = await fetch(ENDPOINT, { signal });
  if (!res.ok) return null;
  const body = (await res.json()) as { result?: string; rates?: { MXN?: number } };
  const mxn = body.rates?.MXN;
  if (body.result !== 'success' || typeof mxn !== 'number' || !Number.isFinite(mxn) || mxn <= 0) {
    return null;
  }
  return mxn;
}

/** Fetch live USD→MXN. Cached after first success; concurrent callers share one request. */
export function fetchLiveFxRate(): Promise<number | null> {
  if (cached !== null) return Promise.resolve(cached);
  if (inFlight !== null) return inFlight;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  inFlight = fetchOnce(ctrl.signal)
    .then((rate) => {
      if (rate !== null) cached = rate;
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
