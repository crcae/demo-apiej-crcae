import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import type { Building, Land, Park } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';
import { Card, CardBody, StatusBadge } from '../../components/ui/primitives.js';

function rasterStyle(
  id: string,
  tiles: string[],
  attribution: string,
): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      [id]: { type: 'raster', tiles, tileSize: 256, attribution },
    },
    layers: [{ id: `${id}-layer`, type: 'raster', source: id, minzoom: 0, maxzoom: 19 }],
  };
}

// Primary: CartoDB Positron (ultra reliable). Fallback: keyless OSM standard.
// Satellite: Esri World Imagery. Inline objects — zero style-JSON requests.
const STYLE_PRIMARY = rasterStyle(
  'carto-light',
  [
    'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  ],
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
);
const STYLE_FALLBACK = rasterStyle(
  'osm-tiles',
  ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
);
const STYLE_SAT = rasterStyle(
  'esri-sat',
  ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
);

const GDL: [number, number] = [-103.33, 20.62];

interface CorridorZone {
  name: string;
  color: string;
  center: [number, number];
  dx: number;
  dy: number;
}

// Illustrative corridor bounds across the Guadalajara metro area (reference: APIEJ).
const CORRIDOR_ZONES: CorridorZone[] = [
  { name: 'Zapopan Norte', color: '#3b82f6', center: [-103.46, 20.76], dx: 0.05, dy: 0.035 },
  { name: 'Antigua Zona Industrial', color: '#06b6d4', center: [-103.33, 20.66], dx: 0.045, dy: 0.03 },
  { name: 'Periférico Sur', color: '#84cc16', center: [-103.38, 20.6], dx: 0.05, dy: 0.025 },
  { name: 'López Mateos Sur', color: '#2563eb', center: [-103.46, 20.57], dx: 0.05, dy: 0.03 },
  { name: 'El Salto', color: '#f97316', center: [-103.2, 20.52], dx: 0.055, dy: 0.035 },
  { name: 'Tonalá', color: '#f59e0b', center: [-103.24, 20.63], dx: 0.04, dy: 0.03 },
  { name: 'Circuito Metropolitano Sur', color: '#a3e635', center: [-103.31, 20.55], dx: 0.05, dy: 0.025 },
  { name: 'Carretera a Colima', color: '#c084fc', center: [-103.52, 20.48], dx: 0.06, dy: 0.04 },
];

// Extra locality reference pills (context only — not selectable zones).
const LOCALITY_PILLS: Array<{ name: string; at: [number, number] }> = [
  { name: 'La Venta del Astillero', at: [-103.5, 20.73] },
  { name: 'Santa Anita', at: [-103.44, 20.53] },
  { name: 'San Agustín', at: [-103.47, 20.53] },
  { name: 'Tlaquepaque de Zúñiga', at: [-103.31, 20.64] },
];

function zoneRing(z: CorridorZone): number[][][] {
  const [cx, cy] = z.center;
  return [[[cx - z.dx, cy - z.dy], [cx + z.dx, cy - z.dy], [cx + z.dx, cy + z.dy], [cx - z.dx, cy + z.dy], [cx - z.dx, cy - z.dy]]];
}

const CORRIDOR_FC: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: CORRIDOR_ZONES.map((z) => ({
    type: 'Feature',
    properties: { name: z.name, color: z.color },
    geometry: { type: 'Polygon', coordinates: zoneRing(z) },
  })),
};

function zoneBounds(z: CorridorZone): maplibregl.LngLatBounds {
  const [cx, cy] = z.center;
  return new maplibregl.LngLatBounds([cx - z.dx, cy - z.dy], [cx + z.dx, cy + z.dy]);
}

function pinStyle(status: Park['status']): { background: string; glyph: string; fg: string } {
  if (status === 'VERIFIED') return { background: '#b3d700', glyph: '✓', fg: '#0F172A' };
  if (status === 'PENDING_VALIDATION') return { background: '#00a2ff', glyph: '●', fg: '#ffffff' };
  return { background: '#94a3b8', glyph: '📍', fg: '#ffffff' };
}

type Basemap = 'mapa' | 'satelite';
type SideTab = 'corredores' | 'ficha';

interface Props {
  parks: Park[];
  buildings: Building[];
  lands: Land[];
  isStaff: boolean;
}

export function ParkMapView({ parks, buildings, lands, isStaff }: Props): React.JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const labelMarkers = useRef<maplibregl.Marker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fCorridor, setFCorridor] = useState<string>('ALL');
  const [fStatus, setFStatus] = useState<string>('ALL');
  const [fClass, setFClass] = useState<string>('ALL');
  const [fAvail, setFAvail] = useState<string>('ALL');
  const [basemap, setBasemap] = useState<Basemap>('mapa');
  const basemapRef = useRef<Basemap>('mapa');
  const [showCorr, setShowCorr] = useState(true);
  const [tab, setTab] = useState<SideTab>('corredores');
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');
  const loaded = useRef(false);

  const corridors = useMemo(() => [...new Set(parks.map((p) => p.corridor))], [parks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parks.filter((p) => {
      if (fCorridor !== 'ALL' && p.corridor !== fCorridor) return false;
      if (fStatus !== 'ALL' && p.status !== fStatus) return false;
      const kids = buildings.filter((b) => b.parkId === p.id);
      if (fClass !== 'ALL' && !kids.some((b) => b.buildingClass === fClass)) return false;
      if (fAvail !== 'ALL' && !kids.some((b) => b.availabilityState === fAvail)) return false;
      if (q !== '' && !`${p.name} ${p.municipality} ${p.address ?? ''}`.toLowerCase().includes(q)) return false;
      return p.lat !== undefined && p.lng !== undefined;
    });
  }, [parks, buildings, query, fCorridor, fStatus, fClass, fAvail]);

  const selected = parks.find((p) => p.id === selectedId) ?? null;
  const selBuildings = selected ? buildings.filter((b) => b.parkId === selected.id) : [];
  const selLands = selected ? lands.filter((l) => l.parkId === selected.id) : [];
  const selAvailable = selBuildings
    .filter((b) => b.availabilityState === 'AVAILABLE')
    .reduce((s, b) => s + b.netRentableM2, 0);

  function addCorridorLayers(map: maplibregl.Map): void {
    if (map.getSource('corridors') !== undefined) return;
    map.addSource('corridors', { type: 'geojson', data: CORRIDOR_FC });
    map.addLayer({
      id: 'corr-fill', type: 'fill', source: 'corridors',
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 },
      layout: { visibility: showCorr ? 'visible' : 'none' },
    });
    map.addLayer({
      id: 'corr-line', type: 'line', source: 'corridors',
      paint: { 'line-color': ['get', 'color'], 'line-width': 2 },
      layout: { visibility: showCorr ? 'visible' : 'none' },
    });
  }

  function clearMarkers(): void {
    markers.current.forEach((m) => m.remove());
    markers.current = [];
  }

  function renderPins(map: maplibregl.Map): void {
    clearMarkers();
    filtered.forEach((p) => {
      if (p.lat === undefined || p.lng === undefined) return;
      const isSel = p.id === selectedId;
      const pin = pinStyle(p.status);
      const el = document.createElement('button');
      el.type = 'button';
      el.title = p.name;
      el.style.width = isSel ? '30px' : '26px';
      el.style.height = isSel ? '30px' : '26px';
      el.style.borderRadius = '9999px';
      el.style.background = isSel ? '#0F172A' : pin.background;
      el.style.color = isSel ? '#fff' : pin.fg;
      el.style.fontSize = '13px';
      el.style.fontWeight = '800';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.border = '2.5px solid #fff';
      el.style.boxShadow = '0 2px 8px rgba(11,25,44,.4)';
      el.style.cursor = 'pointer';
      el.textContent = isSel ? '📍' : pin.glyph;
      el.addEventListener('click', () => {
        setSelectedId(p.id);
        setTab('ficha');
      });
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map));
    });
  }

  function renderLabels(map: maplibregl.Map): void {
    labelMarkers.current.forEach((m) => m.remove());
    labelMarkers.current = [];
    const pill = (text: string, at: [number, number], dim: boolean): void => {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.background = '#fff';
      el.style.borderRadius = '9999px';
      el.style.padding = dim ? '1px 7px' : '2px 8px';
      el.style.fontSize = dim ? '9px' : '10px';
      el.style.fontWeight = dim ? '600' : '800';
      el.style.color = dim ? '#475569' : '#0F172A';
      el.style.boxShadow = '0 1px 4px rgba(11,25,44,.25)';
      el.style.whiteSpace = 'nowrap';
      el.style.display = showCorr ? 'block' : 'none';
      labelMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat(at).addTo(map));
    };
    CORRIDOR_ZONES.forEach((z) => pill(z.name, z.center, false));
    LOCALITY_PILLS.forEach((l) => pill(l.name, l.at, true));
  }

  const stageRef = useRef(0); // 0 = primary, 1 = OSM fallback (mapa mode only)
  const timers = useRef<number[]>([]);

  function clearCascade(): void {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  /** Advance the mapa-mode cascade. Time-based so hung requests (no error
   *  events) also trigger the fallback instead of stalling on the watchdog. */
  function advanceCascade(map: maplibregl.Map): void {
    if (loaded.current || basemapRef.current !== 'mapa') return;
    if (stageRef.current >= 1) {
      setTileState('error');
      return;
    }
    stageRef.current = 1;
    setTileState('loading');
    try {
      map.setStyle(STYLE_FALLBACK);
    } catch {
      setTileState('error');
    }
  }

  function armWatchdog(map: maplibregl.Map): void {
    clearCascade();
    timers.current.push(window.setTimeout(() => advanceCascade(map), 5000));
    timers.current.push(window.setTimeout(() => {
      if (!loaded.current) setTileState('error');
    }, 11000));
  }

  useEffect(() => {
    if (mapRef.current === null || mapObj.current !== null) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_PRIMARY,
      center: GDL,
      zoom: 10,
      attributionControl: { compact: true },
    });
    map.on('load', () => {
      loaded.current = true;
      clearCascade();
      addCorridorLayers(map);
      renderLabels(map);
      setTileState('ready');
    });
    map.on('style.load', () => {
      addCorridorLayers(map);
      renderLabels(map);
    });
    // Fast path: explicit failures jump the cascade immediately. Transient
    // per-tile errors on a loaded map never block rendering.
    map.on('error', () => advanceCascade(map));
    armWatchdog(map);
    mapObj.current = map;
    return () => {
      clearCascade();
      map.remove();
      mapObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap switch (style reload drops sources → re-added on style.load).
  useEffect(() => {
    const map = mapObj.current;
    if (map === null) return;
    basemapRef.current = basemap;
    stageRef.current = 0;
    loaded.current = false;
    setTileState('loading');
    map.setStyle(basemap === 'mapa' ? STYLE_PRIMARY : STYLE_SAT);
    armWatchdog(map);
    return () => clearCascade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap]);

  // Pins + corridor visibility follow filters/toggle.
  useEffect(() => {
    const map = mapObj.current;
    if (map === null) return;
    renderPins(map);
    if (map.getLayer('corr-fill') !== undefined) {
      const vis = showCorr ? 'visible' : 'none';
      map.setLayoutProperty('corr-fill', 'visibility', vis);
      map.setLayoutProperty('corr-line', 'visibility', vis);
    }
    labelMarkers.current.forEach((m) => {
      const el = m.getElement();
      el.style.display = showCorr ? 'block' : 'none';
    });
    if (filtered.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach((p) => {
        if (p.lat !== undefined && p.lng !== undefined) bounds.extend([p.lng, p.lat]);
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, showCorr, selectedId]);

  function toggleFullscreen(): void {
    const host = wrapRef.current;
    if (host === null) return;
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void host.requestFullscreen().catch(() => undefined);
    }
  }

  function fitAll(): void {
    const map = mapObj.current;
    if (map === null || filtered.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    filtered.forEach((p) => {
      if (p.lat !== undefined && p.lng !== undefined) bounds.extend([p.lng, p.lat]);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
  }

  function focusZone(z: CorridorZone): void {
    mapObj.current?.fitBounds(zoneBounds(z), { padding: 50, maxZoom: 13 });
  }

  function clearFilters(): void {
    setQuery('');
    setFCorridor('ALL');
    setFStatus('ALL');
    setFClass('ALL');
    setFAvail('ALL');
  }

  function pickPark(id: string): void {
    setSelectedId(id);
    setTab('ficha');
  }

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const selCls = 'w-full rounded-xl border border-white/60 bg-[#E0E5EC] px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none';

  return (
    <div>
      {/* Header */}
      <p className="text-xs font-medium text-slate-500">Panel / Mapa GIS</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Mapa del mercado industrial</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Explora corredores, parques y espacios disponibles.</p>
        </div>
        <span className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
          {parks.length} Parques <span className="font-medium text-slate-400">|</span> {buildings.length} Naves <span className="font-medium text-slate-400">|</span> {lands.length} Terrenos
          <span className="ml-2 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Datos de ejemplo
          </span>
        </span>
      </div>

      {/* Filter toolbar */}
      <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EBF0F5] p-2.5 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
        <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Buscar parque o ubicación"
          className="w-56 rounded-xl border border-white/50 bg-[#E0E5EC] px-3.5 py-1.5 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500 focus:outline-none"
        />
        <select className={`${selCls} w-auto`} value={fCorridor} onChange={(e) => setFCorridor(e.target.value)}>
          <option value="ALL">Corredor: Todos</option>
          {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={`${selCls} w-auto`} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="ALL">Estatus: Todos</option>
          <option value="VERIFIED">Verificado</option>
          <option value="PENDING_VALIDATION">En revisión</option>
          <option value="DRAFT">Borrador</option>
        </select>
        <select className={`${selCls} w-auto`} value={fClass} onChange={(e) => setFClass(e.target.value)}>
          <option value="ALL">Clase: Todas</option>
          <option value="A">Clase A</option>
          <option value="A-">Clase A-</option>
          <option value="B">Clase B</option>
        </select>
        <select className={`${selCls} w-auto`} value={fAvail} onChange={(e) => setFAvail(e.target.value)}>
          <option value="ALL">Disponibilidad: Toda</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="LEASED">Ocupada</option>
          <option value="UNDER_CONSTRUCTION">En construcción</option>
        </select>
        </div>
        <button
          type="button" onClick={clearFilters}
          className="ml-auto cursor-pointer px-2 text-xs font-bold text-[#00a2ff] transition hover:underline"
        >
          Limpiar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Map canvas */}
        <Card>
          <CardBody>
            <div ref={wrapRef} className="relative">
              <div ref={mapRef} className="h-[calc(100vh-280px)] min-h-[520px] w-full overflow-hidden rounded-3xl ring-1 ring-slate-200" />
              {tileState === 'loading' && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-full border border-white/60 bg-[#EBF0F5] px-4 py-2 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00a2ff]/20 border-t-[#00a2ff]" />
                    <p className="text-[11px] font-bold text-slate-700">Cargando tiles del mapa…</p>
                  </div>
                </div>
              )}
              {tileState === 'error' && (
                <div className="absolute left-1/2 top-3 z-10 w-max max-w-[92%] -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-[#EBF0F5] px-4 py-2 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
                    <p className="text-[11px] font-bold text-slate-700">Mapa base no disponible tras reintentos — pines y ficha siguen activos.</p>
                  </div>
                </div>
              )}
              {/* Top-left mode switch */}
              <div className="absolute left-3 top-3 flex gap-1 rounded-full bg-[#E2E8F0] p-1 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
                {(['mapa', 'satelite'] as Basemap[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBasemap(m)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 ${
                      basemap === m ? 'bg-[#00a2ff] text-white shadow-sm' : 'text-slate-600 hover:bg-[#EBF0F5]'
                    }`}
                  >
                    {m === 'mapa' ? 'Mapa' : 'Satélite'}
                  </button>
                ))}
              </div>
              {/* Top-right controls */}
              <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorr((s) => !s)}
                  title="Mostrar / ocultar polígonos de corredores"
                  className="flex items-center gap-2 rounded-full border border-white/60 bg-[#EBF0F5] px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                >
                  Corredores
                  <span className={`relative h-4 w-8 rounded-full transition ${showCorr ? 'bg-[#10b981]' : 'bg-slate-300'}`}>
                    <i className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${showCorr ? 'left-4' : 'left-0.5'}`} />
                  </span>
                  [{showCorr ? 'ON' : 'OFF'}]
                </button>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button" onClick={() => mapObj.current?.zoomIn()} title="Acercar"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-[#EBF0F5] text-base font-black text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                  >
                    +
                  </button>
                  <button
                    type="button" onClick={() => mapObj.current?.zoomOut()} title="Alejar"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-[#EBF0F5] text-base font-black text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                  >
                    −
                  </button>
                  <button
                    type="button" onClick={toggleFullscreen} title="Pantalla completa"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-[#EBF0F5] text-xs font-black text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                  >
                    ⤢
                  </button>
                  <button
                    type="button" onClick={fitAll} title="Encuadrar resultados"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-[#EBF0F5] text-xs font-black text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                  >
                    [ ]
                  </button>
                </div>
              </div>
            </div>
            {/* Footer bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-slate-500">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Propuesta visual · Zonas ilustrativas</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#b3d700]" /> Verificado</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#00a2ff]" /> En revisión</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700"><i className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" /> Borrador</span>
              </span>
              <span className="font-medium">© OpenStreetMap contributors | Referencia de corredores: APIEJ | {filtered.length} parques visibles</span>
            </div>
            {tileState === 'error' && (
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPark(p.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-bold transition ${
                      selectedId === p.id
                        ? 'border-[#0F172A] bg-[#0F172A] text-white'
                        : 'border-white/60 bg-[#EBF0F5] text-slate-700 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]'
                    }`}
                  >
                    <i
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: pinStyle(p.status).background }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col justify-between rounded-3xl bg-[#EBF0F5] p-5 shadow-[8px_8px_18px_#c5ccd6,-8px_-8px_18px_#ffffff]">
          <div>
            <div className="mb-3 flex gap-4 border-b border-slate-200">
              {(['corredores', 'ficha'] as SideTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`pb-2 text-sm font-bold transition ${
                    tab === t
                      ? 'border-b-2 border-[#00a2ff] text-[#0F172A]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'corredores' ? 'Corredores' : 'Ficha del parque'}
                </button>
              ))}
            </div>

            {tab === 'corredores' && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Corredores industriales</h3>
                <p className="mb-3 text-xs font-medium text-slate-500">Selecciona una zona para explorar.</p>
                <ul className="space-y-1.5">
                  {CORRIDOR_ZONES.map((z) => (
                    <li
                      key={z.name}
                      className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-[#EBF0F5] p-2.5 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]"
                    >
                      <i className="h-3.5 w-3.5 shrink-0 rounded-md" style={{ background: z.color }} />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{z.name}</span>
                      <button
                        type="button"
                        onClick={() => focusZone(z)}
                        title={`Enfocar ${z.name} en el mapa`}
                        className="rounded-lg px-1.5 py-0.5 text-sm transition hover:scale-110"
                      >
                        👁
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-200/60 p-3 text-xs font-semibold text-slate-600">
                  📍 Selecciona un parque en el mapa para abrir su ficha.
                </p>
              </div>
            )}

            {tab === 'ficha' && selected === null && (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#0F172A]">Sin parque seleccionado</p>
                <p className="mt-1 text-xs font-medium text-slate-600">Toca un pin o elige un corredor para empezar.</p>
                <button
                  type="button" onClick={() => setTab('corredores')}
                  className="mt-3 rounded-full bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
                >
                  Ver corredores
                </button>
              </div>
            )}

            {tab === 'ficha' && selected !== null && (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-600">{selected.corridor} · {selected.municipality}</p>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">{selected.name}</h3>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]"><dt className="font-medium text-slate-700">Total</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.totalLandM2)}</dd></div>
                  <div className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]"><dt className="font-medium text-slate-700">Disponible (naves)</dt><dd className="font-bold text-[#65A30D]">{formatAreaM2(selAvailable)}</dd></div>
                  <div className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]"><dt className="font-medium text-slate-700">Desarrollado</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.developedM2)}</dd></div>
                  <div className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]"><dt className="font-medium text-slate-700">Reserva</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.reserveM2)}</dd></div>
                </dl>
                <h4 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-700">Infraestructura</h4>
                <ul className="grid grid-cols-2 gap-1 text-xs">
                  {(
                    [
                      ['Agua', selected.infrastructure.water === true],
                      [`Energía ${selected.infrastructure.powerKva !== undefined ? `${selected.infrastructure.powerKva} kVA` : ''}`, selected.infrastructure.powerKva !== undefined],
                      ['Gas natural', selected.infrastructure.gas === true],
                      ['Fibra óptica', selected.infrastructure.fiber === true],
                      ['Espuela férrea', selected.infrastructure.railSpur === true],
                      ['Seguridad 24/7', selected.infrastructure.security === true],
                    ] as Array<[string, boolean]>
                  ).map(([label, ok]) => (
                    <li key={label} className={`rounded-lg px-2 py-1 font-semibold ${ok === true ? 'bg-[#84CC16]/15 text-[#65A30D]' : 'bg-[#E0E5EC] text-slate-600 shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]'}`}>
                      {ok === true ? '✓ ' : '✕ '}{label}
                    </li>
                  ))}
                </ul>
                <h4 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-700">Naves ({selBuildings.length})</h4>
                <ul className="space-y-1.5">
                  {selBuildings.map((b) => (
                    <li key={b.id} className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 text-xs shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{b.code} · Clase {b.buildingClass}</span>
                        <span className="font-medium text-slate-600">{b.availabilityState}</span>
                      </div>
                      <p className="font-medium text-slate-600">
                        {formatAreaM2(b.netRentableM2)} · {formatUsdM2(b.askingRentUsdM2)} ·{' '}
                        {isStaff && b.occupantCompany !== undefined ? (
                          <span className="font-semibold text-[#0F172A]">{b.occupantCompany}</span>
                        ) : (
                          <span>{b.occupantAlias ?? '—'}</span>
                        )}
                      </p>
                    </li>
                  ))}
                  {selBuildings.length === 0 && <li className="text-xs font-medium text-slate-600">Sin naves registradas.</li>}
                </ul>
                {selLands.length > 0 && (
                  <>
                    <h4 className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-700">Terrenos ({selLands.length})</h4>
                    <ul className="space-y-1.5">
                      {selLands.map((l) => (
                        <li key={l.id} className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2 text-xs font-medium text-slate-700 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]">
                          <span className="font-bold text-[#0F172A]">{l.name}</span> · {formatAreaM2(l.sellableM2)} vendibles
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {!isStaff && (
                  <p className="mt-3 rounded-xl bg-[#E0E5EC] p-2 text-[11px] font-medium text-slate-600 shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]">Razones sociales reales ocultas por política de visibilidad.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
