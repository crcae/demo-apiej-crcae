import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { IndustrialListing } from '../../types/domain.js';
import { formatAreaM2 } from '../../utils/formatters.js';

interface Props {
  listings: IndustrialListing[];
}

export function InventoryView({ listings }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [deal, setDeal] = useState<'ALL' | 'RENT' | 'SALE'>('ALL');
  const [corridor, setCorridor] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  const corridors = useMemo(
    () => [...new Set(listings.map((l) => l.corridor))].sort(),
    [listings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (deal !== 'ALL' && l.dealType !== deal) return false;
      if (corridor !== 'ALL' && l.corridor !== corridor) return false;
      if (q !== '' && !`${l.title} ${l.code} ${l.municipality} ${l.listedBy}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [listings, query, deal, corridor]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (mapRef.current === null || mapObj.current !== null) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          sat: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri',
          },
        },
        layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
      },
      center: [-103.35, 20.62],
      zoom: 10.2,
    });
    mapObj.current = map;
    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.remove();
      mapObj.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (map === null) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    filtered.forEach((l) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-black shadow-lg';
      el.style.background = selected?.id === l.id ? '#FF7A00' : '#4A6CFF';
      el.style.color = '#fff';
      el.textContent = l.dealType === 'SALE' ? '$' : 'R';
      el.title = l.title;
      el.onclick = () => setSelectedId(l.id);
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([l.lng, l.lat]).addTo(map));
    });
    if (filtered.length > 0) {
      const b = new maplibregl.LngLatBounds();
      filtered.forEach((l) => b.extend([l.lng, l.lat]));
      map.fitBounds(b, { padding: 48, maxZoom: 12, duration: 600 });
    }
  }, [filtered, selected?.id]);

  useEffect(() => {
    if (selected === null || mapObj.current === null) return;
    mapObj.current.easeTo({ center: [selected.lng, selected.lat], zoom: Math.max(mapObj.current.getZoom(), 11.5), duration: 500 });
  }, [selected?.id]);

  return (
    <div>
      <p className="text-xs font-medium text-slate-500">Panel / Inventario Industrial</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0E1A3D]">Inventario industrial</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Propiedades publicadas en el observatorio APIEJ.</p>
        </div>
        <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs font-bold text-slate-700">
          {filtered.length} propiedades
        </span>
      </div>

      <div className="mb-4 mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/80">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar código, ubicación o desarrollador"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#4A6CFF]"
        />
        <select value={deal} onChange={(e) => setDeal(e.target.value as 'ALL' | 'RENT' | 'SALE')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold">
          <option value="ALL">Tipo: Todos</option>
          <option value="RENT">Renta</option>
          <option value="SALE">Venta</option>
        </select>
        <select value={corridor} onChange={(e) => setCorridor(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold">
          <option value="ALL">Corredor: Todos</option>
          {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)]">
        <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">Ninguna propiedad coincide con los filtros.</p>
          )}
          {filtered.map((l) => {
            const active = selected?.id === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedId(l.id)}
                className={`w-full overflow-hidden rounded-2xl border text-left transition ${
                  active ? 'border-[#4A6CFF] bg-white shadow-md ring-2 ring-[#4A6CFF]/25' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="grid grid-cols-[140px_1fr] gap-0 sm:grid-cols-[180px_1fr]">
                  <img src={l.imageUrl} alt="" className="h-full min-h-[120px] w-full object-cover" />
                  <div className="p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{l.code}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-extrabold text-[#0E1A3D]">{l.title}</p>
                    <p className={`mt-1.5 text-xs font-black ${l.dealType === 'SALE' ? 'text-[#FF7A00]' : 'text-[#4A6CFF]'}`}>
                      {l.priceLabel}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {l.municipality} · {l.corridor} · {formatAreaM2(l.areaM2)}
                      {l.buildingClass !== undefined ? ` · Clase ${l.buildingClass}` : ''}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-slate-400">Listed by {l.listedBy}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky top-[4.5rem] h-[calc(100vh-200px)] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
          <div ref={mapRef} className="h-full w-full" />
          {selected !== null && (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur">
              <p className="text-xs font-extrabold text-[#0E1A3D]">{selected.title}</p>
              <p className="mt-0.5 text-[11px] font-bold text-[#4A6CFF]">{selected.priceLabel} · {formatAreaM2(selected.areaM2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
