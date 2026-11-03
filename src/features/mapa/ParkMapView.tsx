import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CORRIDOR_FC, CORRIDORS, LOCALITY_PILLS, corridorCenter, type CorridorDef,
} from '../../mock/corridors.mock.js';
import type { Building, Land, Park } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';
import { PageHeader } from '../../components/PageHeader.js';
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
const STYLE_HOT = rasterStyle(
  'osm-hot',
  [
    'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  ],
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>',
);
const STYLE_SAT = rasterStyle(
  'esri-sat',
  ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  'Imagery &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
);

// Ordered rescue chain for mapa mode (distinct hosts/providers).
const MAP_STAGES = [STYLE_PRIMARY, STYLE_FALLBACK, STYLE_HOT];
const MAP_HOSTS = ['basemaps.cartocdn.com', 'tile.openstreetmap.org', 'tile.openstreetmap.fr (HOT)'];

const GDL: [number, number] = [-103.33, 20.62];

function zoneBounds(c: CorridorDef): maplibregl.LngLatBounds {
  const b = new maplibregl.LngLatBounds();
  c.path.forEach((p) => b.extend(p));
  return b;
}

function pinStyle(status: Park['status']): { background: string; glyph: string; fg: string } {
  if (status === 'VERIFIED') return { background: '#10B981', glyph: '✓', fg: '#ffffff' };
  if (status === 'PENDING_VALIDATION') return { background: '#FF7A00', glyph: '●', fg: '#ffffff' };
  return { background: '#94a3b8', glyph: '·', fg: '#ffffff' };
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
  const [basemap, setBasemap] = useState<Basemap>('satelite');
  const basemapRef = useRef<Basemap>('satelite');
  const [showCorr, setShowCorr] = useState(true);
  const [activeCorridorId, setActiveCorridorId] = useState<string | null>(null);
  const [hoverCorridorId, setHoverCorridorId] = useState<string | null>(null);
  const [tab, setTab] = useState<SideTab>('corredores');
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');
  const loaded = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const activeCorridorRef = useRef<string | null>(null);
  activeCorridorRef.current = activeCorridorId;

  const corridors = useMemo(() => [...new Set(parks.map((p) => p.corridor))], [parks]);

  const matchedByFilters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parks.filter((p) => {
      if (fCorridor !== 'ALL' && p.corridor !== fCorridor) return false;
      if (fStatus !== 'ALL' && p.status !== fStatus) return false;
      const kids = buildings.filter((b) => b.parkId === p.id);
      if (fClass !== 'ALL' && !kids.some((b) => b.buildingClass === fClass)) return false;
      if (fAvail !== 'ALL' && !kids.some((b) => b.availabilityState === fAvail)) return false;
      if (q !== '' && !`${p.name} ${p.municipality} ${p.address ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [parks, buildings, query, fCorridor, fStatus, fClass, fAvail]);

  const missingCoords = useMemo(
    () => matchedByFilters.filter((p) => p.lat === undefined || p.lng === undefined).length,
    [matchedByFilters],
  );

  /** Pins on the map — only parks with coordinates. */
  const filtered = useMemo(
    () => matchedByFilters.filter((p) => p.lat !== undefined && p.lng !== undefined),
    [matchedByFilters],
  );

  const filtersActive = query !== '' || fCorridor !== 'ALL' || fStatus !== 'ALL' || fClass !== 'ALL' || fAvail !== 'ALL';
  const emptyRole = parks.length === 0;
  const emptyFilters = !emptyRole && matchedByFilters.length === 0;

  const selected = parks.find((p) => p.id === selectedId) ?? null;
  const selBuildings = selected ? buildings.filter((b) => b.parkId === selected.id) : [];
  const selLands = selected ? lands.filter((l) => l.parkId === selected.id) : [];
  const selAvailable = selBuildings
    .filter((b) => b.availabilityState === 'AVAILABLE')
    .reduce((s, b) => s + b.netRentableM2, 0);

  function paintCorridorEmphasis(map: maplibregl.Map, focusId: string | null): void {
    if (map.getLayer('corr-fill') === undefined) return;
    if (focusId === null) {
      map.setPaintProperty('corr-fill', 'fill-opacity', 0.5);
      map.setPaintProperty('corr-line', 'line-width', 4);
      map.setPaintProperty('corr-line', 'line-opacity', 1);
      if (map.getLayer('corr-glow') !== undefined) {
        map.setPaintProperty('corr-glow', 'line-opacity', 0.35);
        map.setPaintProperty('corr-glow', 'line-width', 10);
      }
      return;
    }
    map.setPaintProperty('corr-fill', 'fill-opacity', [
      'case', ['==', ['get', 'id'], focusId], 0.78, 0.12,
    ]);
    map.setPaintProperty('corr-line', 'line-width', [
      'case', ['==', ['get', 'id'], focusId], 6, 1.5,
    ]);
    map.setPaintProperty('corr-line', 'line-opacity', [
      'case', ['==', ['get', 'id'], focusId], 1, 0.35,
    ]);
    if (map.getLayer('corr-glow') !== undefined) {
      map.setPaintProperty('corr-glow', 'line-opacity', [
        'case', ['==', ['get', 'id'], focusId], 0.55, 0.05,
      ]);
      map.setPaintProperty('corr-glow', 'line-width', [
        'case', ['==', ['get', 'id'], focusId], 14, 4,
      ]);
    }
  }

  function addCorridorLayers(map: maplibregl.Map): void {
    if (map.getSource('corridors') !== undefined) return;
    map.addSource('corridors', { type: 'geojson', data: CORRIDOR_FC, promoteId: 'id' });
    map.addLayer({
      id: 'corr-glow', type: 'line', source: 'corridors',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 10,
        'line-opacity': 0.35,
        'line-blur': 6,
      },
      layout: { visibility: showCorr ? 'visible' : 'none' },
    });
    map.addLayer({
      id: 'corr-fill', type: 'fill', source: 'corridors',
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.5 },
      layout: { visibility: showCorr ? 'visible' : 'none' },
    });
    map.addLayer({
      id: 'corr-line', type: 'line', source: 'corridors',
      paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 1 },
      layout: { visibility: showCorr ? 'visible' : 'none' },
    });
    paintCorridorEmphasis(map, activeCorridorRef.current);

    map.on('click', 'corr-fill', (e) => {
      const f = e.features?.[0];
      const id = typeof f?.properties?.id === 'string' ? f.properties.id : null;
      if (id === null) return;
      const z = CORRIDORS.find((c) => c.id === id);
      if (z === undefined) return;
      setActiveCorridorId(id);
      setTab('corredores');
      map.fitBounds(zoneBounds(z), { padding: 56, maxZoom: 12.5, duration: 700 });
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 12, className: 'apiej-corr-popup' })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font:700 12px/1.3 system-ui,sans-serif;color:#0E1A3D">
            <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${z.color};margin-right:6px;vertical-align:middle"></span>
            ${z.name}
            <div style="margin-top:4px;font-weight:600;font-size:10px;color:#64748b">${z.short} · Corredor industrial APIEJ</div>
          </div>`,
        )
        .addTo(map);
    });
    map.on('mouseenter', 'corr-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'corr-fill', () => { map.getCanvas().style.cursor = ''; });
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
    CORRIDORS.forEach((z) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = z.short;
      el.style.background = z.color;
      el.style.borderRadius = '9999px';
      el.style.padding = '3px 10px';
      el.style.fontSize = '10px';
      el.style.fontWeight = '800';
      el.style.color = '#fff';
      el.style.border = '2px solid rgba(255,255,255,0.9)';
      el.style.boxShadow = '0 2px 8px rgba(11,25,44,.35)';
      el.style.whiteSpace = 'nowrap';
      el.style.cursor = 'pointer';
      el.style.display = showCorr ? 'block' : 'none';
      el.title = z.name;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setActiveCorridorId(z.id);
        setTab('corredores');
        map.fitBounds(zoneBounds(z), { padding: 56, maxZoom: 12.5, duration: 700 });
      });
      labelMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat(corridorCenter(z)).addTo(map));
    });
    LOCALITY_PILLS.forEach((l) => {
      const el = document.createElement('div');
      el.textContent = l.name;
      el.style.background = 'rgba(15,23,42,0.72)';
      el.style.borderRadius = '9999px';
      el.style.padding = '1px 7px';
      el.style.fontSize = '9px';
      el.style.fontWeight = '600';
      el.style.color = '#fff';
      el.style.whiteSpace = 'nowrap';
      el.style.display = showCorr ? 'block' : 'none';
      labelMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat(l.at).addTo(map));
    });
  }

  const stageRef = useRef(0); // index into MAP_STAGES (mapa mode only)
  const timers = useRef<number[]>([]);
  const [failedHosts, setFailedHosts] = useState<string[]>([]);

  function clearCascade(): void {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function markFailed(): void {
    const host = MAP_HOSTS[stageRef.current] ?? 'desconocido';
    setFailedHosts((prev) => (prev.includes(host) ? prev : [...prev, host]));
  }

  /** Advance the mapa-mode cascade. Time-based so hung requests (no error
   *  events) also trigger the next provider instead of stalling. */
  function advanceCascade(map: maplibregl.Map): void {
    if (loaded.current || basemapRef.current !== 'mapa') return;
    markFailed();
    if (stageRef.current >= MAP_STAGES.length - 1) {
      setTileState('error');
      return;
    }
    stageRef.current += 1;
    setTileState('loading');
    try {
      map.setStyle(MAP_STAGES[stageRef.current]);
    } catch {
      setTileState('error');
    }
  }

  function armWatchdog(map: maplibregl.Map): void {
    clearCascade();
    timers.current.push(window.setTimeout(() => advanceCascade(map), 5000));
    timers.current.push(window.setTimeout(() => advanceCascade(map), 9000));
    timers.current.push(window.setTimeout(() => {
      if (!loaded.current) {
        markFailed();
        setTileState('error');
      }
    }, 14000));
  }

  /** Manual recovery: restart the cascade from the primary provider. */
  function retryTiles(): void {
    const map = mapObj.current;
    if (map === null) return;
    clearCascade();
    stageRef.current = 0;
    loaded.current = false;
    setFailedHosts([]);
    setTileState('loading');
    try {
      map.setStyle(basemapRef.current === 'mapa' ? STYLE_PRIMARY : STYLE_SAT);
    } catch {
      setTileState('error');
    }
    armWatchdog(map);
  }

  useEffect(() => {
    if (mapRef.current === null || mapObj.current !== null) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_SAT,
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
      if (map.getLayer('corr-glow') !== undefined) map.setLayoutProperty('corr-glow', 'visibility', vis);
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

  useEffect(() => {
    const map = mapObj.current;
    if (map === null || map.getLayer('corr-fill') === undefined) return;
    paintCorridorEmphasis(map, hoverCorridorId ?? activeCorridorId);
  }, [activeCorridorId, hoverCorridorId, tileState]);

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

  function focusZone(z: CorridorDef): void {
    setActiveCorridorId(z.id);
    mapObj.current?.fitBounds(zoneBounds(z), { padding: 56, maxZoom: 12.5, duration: 700 });
  }

  function clearCorridorSelection(): void {
    setActiveCorridorId(null);
    setHoverCorridorId(null);
    popupRef.current?.remove();
    popupRef.current = null;
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
  const selCls = 'w-full rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none';

  return (
    <div>
      <PageHeader
        section="Mapa GIS"
        title="Mapa del mercado industrial"
        subtitle="Explora corredores, parques y espacios disponibles."
        actions={(
          <span className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
            {parks.length} Parques <span className="font-medium text-slate-400">|</span> {buildings.length} Naves <span className="font-medium text-slate-400">|</span> {lands.length} Terrenos
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Datos de ejemplo
            </span>
          </span>
        )}
      />

      <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Buscar parque o ubicación"
          className="w-56 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-500 focus:outline-none"
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
          className="ml-auto cursor-pointer px-2 text-xs font-bold text-[#4A6CFF] transition hover:underline"
        >
          Limpiar
        </button>
      </div>

      {emptyRole && (
        <div className="mb-4 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          Sin parques visibles para tu rol.
        </div>
      )}
      {emptyFilters && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm">
          <span>Ningún parque coincide con los filtros.</span>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full bg-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
          >
            Restablecer filtros
          </button>
        </div>
      )}
      {!emptyRole && !emptyFilters && missingCoords > 0 && (
        <p className="mb-3 text-xs font-semibold text-slate-500">
          {missingCoords} parque{missingCoords === 1 ? '' : 's'} sin coordenadas (no aparecen como pin).
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Map canvas */}
        <Card>
          <CardBody>
            <div ref={wrapRef} className="relative">
              <div ref={mapRef} className="h-[calc(100vh-140px)] min-h-[640px] w-full overflow-hidden rounded-3xl ring-1 ring-slate-200" />
              {(emptyRole || emptyFilters) && (
                <div className="absolute inset-0 z-[5] flex items-center justify-center rounded-3xl bg-white/85 p-6">
                  <div className="max-w-sm rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm">
                    <p className="text-sm font-extrabold text-slate-900">
                      {emptyRole ? 'Sin parques visibles para tu rol' : 'Ningún parque coincide con los filtros'}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {emptyRole
                        ? 'Cambia de persona en el sidebar o espera datos verificados.'
                        : 'Ajusta búsqueda, corredor o disponibilidad.'}
                    </p>
                    {filtersActive && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 rounded-xl bg-[#4A6CFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                      >
                        Restablecer filtros
                      </button>
                    )}
                  </div>
                </div>
              )}
              {tileState === 'loading' && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 shadow-sm">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4A6CFF]/20 border-t-[#4A6CFF]" />
                    <p className="text-[11px] font-bold text-slate-700">Cargando tiles del mapa…</p>
                  </div>
                </div>
              )}
              {tileState === 'error' && (
                <div className="absolute left-1/2 top-3 z-10 w-max max-w-[92%] -translate-x-1/2">
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-amber-500/40 bg-white px-4 py-2 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-700">Mapa base sin respuesta — pines y ficha siguen activos.</p>
                    <button
                      type="button"
                      onClick={retryTiles}
                      className="rounded-full bg-[#0F172A] px-3 py-1 text-[11px] font-bold text-white transition hover:opacity-90"
                    >
                      Reintentar
                    </button>
                    {failedHosts.length > 0 && (
                      <details className="text-[10px] font-medium text-slate-500">
                        <summary className="cursor-pointer font-bold hover:underline">Detalle técnico</summary>
                        <span>Proveedores sin respuesta: {failedHosts.join(' · ')}</span>
                      </details>
                    )}
                  </div>
                </div>
              )}
              {/* Top-left mode switch */}
              <div className="absolute left-3 top-3 flex gap-1 rounded-full bg-[#E2E8F0] p-1 ">
                {(['mapa', 'satelite'] as Basemap[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBasemap(m)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 ${
                      basemap === m ? 'bg-[#4A6CFF] text-white shadow-sm' : 'text-slate-600 hover:bg-white'
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
                  className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm"
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
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-base font-black text-slate-700 shadow-sm"
                  >
                    +
                  </button>
                  <button
                    type="button" onClick={() => mapObj.current?.zoomOut()} title="Alejar"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-base font-black text-slate-700 shadow-sm"
                  >
                    −
                  </button>
                  <button
                    type="button" onClick={toggleFullscreen} title="Pantalla completa"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-xs font-black text-slate-700 shadow-sm"
                  >
                    ⤢
                  </button>
                  <button
                    type="button" onClick={fitAll} title="Encuadrar resultados"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-xs font-black text-slate-700 shadow-sm"
                  >
                    [ ]
                  </button>
                </div>
              </div>
            </div>
            {/* Corridor color legend */}
            {showCorr && (
              <div className="mt-3 flex flex-wrap gap-1.5 px-1">
                {CORRIDORS.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => focusZone(z)}
                    onMouseEnter={() => setHoverCorridorId(z.id)}
                    onMouseLeave={() => setHoverCorridorId(null)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                      activeCorridorId === z.id
                        ? 'ring-2 ring-[#0E1A3D] ring-offset-1'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ background: `${z.color}22`, color: z.color }}
                    title={z.name}
                  >
                    <i className="h-2 w-2 rounded-full" style={{ background: z.color }} />
                    {z.short}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-slate-500">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Corredores APIEJ · clic para resaltar</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Verificado</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF7A00]" /> En revisión</span>
              </span>
              <span className="font-medium">{filtered.length} pines · {matchedByFilters.length} coincidencias</span>
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
                        : 'border-slate-200/80 bg-white text-slate-700 shadow-sm'
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
        <div className="flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <div className="mb-3 flex gap-4 border-b border-slate-200">
              {(['corredores', 'ficha'] as SideTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`pb-2 text-sm font-bold transition ${
                    tab === t
                      ? 'border-b-2 border-[#4A6CFF] text-[#0F172A]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'corredores' ? 'Corredores' : 'Ficha del parque'}
                </button>
              ))}
            </div>

            {tab === 'corredores' && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">Corredores industriales</h3>
                  {activeCorridorId !== null && (
                    <button
                      type="button"
                      onClick={clearCorridorSelection}
                      className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Ver todos
                    </button>
                  )}
                </div>
                <p className="mb-3 text-xs font-medium text-slate-500">Clic para resaltar en el mapa. Hover = preview.</p>
                <ul className="space-y-1.5">
                  {CORRIDORS.map((z) => {
                    const active = activeCorridorId === z.id;
                    return (
                      <li key={z.id}>
                        <button
                          type="button"
                          onClick={() => focusZone(z)}
                          onMouseEnter={() => setHoverCorridorId(z.id)}
                          onMouseLeave={() => setHoverCorridorId(null)}
                          className={`flex w-full items-center gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                            active
                              ? 'border-transparent shadow-md ring-2 ring-offset-1'
                              : 'border-slate-200/80 bg-white shadow-sm hover:brightness-[0.98]'
                          }`}
                          style={active ? { background: `${z.color}18`, boxShadow: `0 0 0 2px ${z.color}` } : undefined}
                        >
                          <i className="h-3.5 w-3.5 shrink-0 rounded-md shadow-sm" style={{ background: z.color }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-slate-800">{z.name}</span>
                            <span className="block text-[10px] font-semibold" style={{ color: z.color }}>{z.short}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">👁</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-200/60 p-3 text-xs font-semibold text-slate-600">
                  También puedes hacer clic sobre un corredor en el mapa.
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
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"><dt className="font-medium text-slate-700">Total</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.totalLandM2)}</dd></div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"><dt className="font-medium text-slate-700">Disponible (naves)</dt><dd className="font-bold text-[#65A30D]">{formatAreaM2(selAvailable)}</dd></div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"><dt className="font-medium text-slate-700">Desarrollado</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.developedM2)}</dd></div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"><dt className="font-medium text-slate-700">Reserva</dt><dd className="font-bold text-[#0F172A]">{formatAreaM2(selected.reserveM2)}</dd></div>
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
                    <li key={label} className={`rounded-lg px-2 py-1 font-semibold ${ok === true ? 'bg-[#84CC16]/15 text-[#65A30D]' : 'bg-slate-50 text-slate-600 shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]'}`}>
                      {ok === true ? '✓ ' : '✕ '}{label}
                    </li>
                  ))}
                </ul>
                <h4 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-700">Naves ({selBuildings.length})</h4>
                <ul className="space-y-1.5">
                  {selBuildings.map((b) => (
                    <li key={b.id} className="rounded-xl border border-slate-200/80 bg-white p-2 text-xs shadow-sm">
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
                        <li key={l.id} className="rounded-xl border border-slate-200/80 bg-white p-2 text-xs font-medium text-slate-700 shadow-sm">
                          <span className="font-bold text-[#0F172A]">{l.name}</span> · {formatAreaM2(l.sellableM2)} vendibles
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {!isStaff && (
                  <p className="mt-3 rounded-xl bg-slate-50 p-2 text-[11px] font-medium text-slate-600 shadow-[inset_2px_2px_4px_#c5ccd6,inset_-2px_-2px_4px_#ffffff]">Razones sociales reales ocultas por política de visibilidad.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
