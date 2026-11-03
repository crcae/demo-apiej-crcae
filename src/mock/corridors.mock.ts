import type { FeatureCollection, Polygon } from 'geojson';

/** Corridor strip defined by a centerline polyline + half-width in degrees. */
export interface CorridorDef {
  id: string;
  name: string;
  short: string;
  color: string;
  /** Centerline [lng, lat][] */
  path: Array<[number, number]>;
  halfWidth: number;
}

/** Buffer a polyline into a thin polygon strip (demo-quality, not geodesic). */
function bufferPath(path: Array<[number, number]>, half: number): number[][][] {
  if (path.length < 2) {
    const [lng, lat] = path[0] ?? [-103.35, 20.65];
    return [[[lng - half, lat - half], [lng + half, lat - half], [lng + half, lat + half], [lng - half, lat + half], [lng - half, lat - half]]];
  }
  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let i = 0; i < path.length; i += 1) {
    const prev = path[Math.max(0, i - 1)]!;
    const next = path[Math.min(path.length - 1, i + 1)]!;
    const cur = path[i]!;
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * half;
    const ny = (dx / len) * half;
    left.push([cur[0] + nx, cur[1] + ny]);
    right.push([cur[0] - nx, cur[1] - ny]);
  }
  const ring = [...left, ...right.reverse(), left[0]!];
  return [ring];
}

export function corridorCenter(c: CorridorDef): [number, number] {
  const mid = c.path[Math.floor(c.path.length / 2)] ?? c.path[0]!;
  return mid;
}

/** APIEJ-style industrial corridors (Guadalajara metro) — illustrative mock for demo. */
export const CORRIDORS: CorridorDef[] = [
  {
    id: 'tala',
    name: 'Tala',
    short: 'Tala',
    color: '#C026D3',
    halfWidth: 0.012,
    path: [[-103.62, 20.58], [-103.60, 20.62], [-103.58, 20.68], [-103.56, 20.74]],
  },
  {
    id: 'zn',
    name: 'Zapopan Norte',
    short: 'ZN',
    color: '#F97316',
    halfWidth: 0.014,
    path: [[-103.52, 20.78], [-103.48, 20.76], [-103.44, 20.74], [-103.40, 20.72]],
  },
  {
    id: 'ps',
    name: 'Periférico Sur',
    short: 'PS',
    color: '#EAB308',
    halfWidth: 0.011,
    path: [[-103.48, 20.58], [-103.44, 20.57], [-103.40, 20.575], [-103.36, 20.59], [-103.32, 20.61], [-103.28, 20.63]],
  },
  {
    id: 'azi',
    name: 'Antigua Zona Industrial',
    short: 'AZI',
    color: '#7C3AED',
    halfWidth: 0.018,
    path: [[-103.355, 20.655], [-103.34, 20.66], [-103.325, 20.665], [-103.31, 20.67]],
  },
  {
    id: 'lms',
    name: 'López Mateos Sur',
    short: 'LMS',
    color: '#2563EB',
    halfWidth: 0.01,
    path: [[-103.46, 20.66], [-103.455, 20.62], [-103.45, 20.58], [-103.445, 20.54], [-103.44, 20.50]],
  },
  {
    id: 'cms',
    name: 'Circuito Metropolitano Sur',
    short: 'CMS',
    color: '#22C55E',
    halfWidth: 0.012,
    path: [[-103.50, 20.50], [-103.44, 20.505], [-103.38, 20.51], [-103.32, 20.515], [-103.26, 20.52]],
  },
  {
    id: 'colima',
    name: 'Carretera a Colima-Acatlán',
    short: 'Colima',
    color: '#EC4899',
    halfWidth: 0.013,
    path: [[-103.55, 20.52], [-103.50, 20.50], [-103.46, 20.47], [-103.42, 20.44]],
  },
  {
    id: 'esti',
    name: 'ES-TL-IM',
    short: 'ES-TL-IM',
    color: '#F43F5E',
    halfWidth: 0.015,
    path: [
      [-103.28, 20.56], [-103.24, 20.54], [-103.20, 20.52], [-103.16, 20.50],
      [-103.22, 20.48], [-103.18, 20.46],
    ],
  },
  {
    id: 'tz',
    name: 'Tonalá-Zapotlanejo',
    short: 'TZ',
    color: '#B45309',
    halfWidth: 0.012,
    path: [[-103.22, 20.64], [-103.18, 20.63], [-103.14, 20.62], [-103.10, 20.61]],
  },
];

export const CORRIDOR_FC: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: CORRIDORS.map((c) => ({
    type: 'Feature',
    properties: { id: c.id, name: c.name, short: c.short, color: c.color },
    geometry: { type: 'Polygon', coordinates: bufferPath(c.path, c.halfWidth) },
  })),
};

export const LOCALITY_PILLS: Array<{ name: string; at: [number, number] }> = [
  { name: 'La Venta del Astillero', at: [-103.5, 20.73] },
  { name: 'Santa Anita', at: [-103.44, 20.53] },
  { name: 'San Agustín', at: [-103.47, 20.53] },
  { name: 'El Salto', at: [-103.18, 20.52] },
  { name: 'Aeropuerto', at: [-103.30, 20.52] },
];
