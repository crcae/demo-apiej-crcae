import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.js';
import type { AvailabilityState, IndustrialListing, ListingDealType } from '../../types/domain.js';
import { formatAreaM2 } from '../../utils/formatters.js';

export type InventoryMode = 'public' | 'manage';

interface Props {
  listings: IndustrialListing[];
  mode?: InventoryMode;
  onUpdateListing?: (id: string, patch: Partial<IndustrialListing>) => void;
}

const AVAIL: AvailabilityState[] = [
  'AVAILABLE', 'RESERVED', 'LEASED', 'SOLD', 'UNDER_CONSTRUCTION', 'OFF_MARKET',
];

export function InventoryView({ listings, mode = 'public', onUpdateListing }: Props): React.JSX.Element {
  const manage = mode === 'manage';
  const [query, setQuery] = useState('');
  const [deal, setDeal] = useState<'ALL' | 'RENT' | 'SALE'>('ALL');
  const [corridor, setCorridor] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<IndustrialListing> | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
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
    if (selected === null) {
      setDraft(null);
      return;
    }
    setDraft({
      title: selected.title,
      priceLabel: selected.priceLabel,
      areaM2: selected.areaM2,
      dealType: selected.dealType,
      availabilityState: selected.availabilityState,
      listedBy: selected.listedBy,
      municipality: selected.municipality,
      corridor: selected.corridor,
    });
  }, [selected?.id]);

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

  function saveDraft(): void {
    if (selected === null || draft === null || onUpdateListing === undefined) return;
    onUpdateListing(selected.id, draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2200);
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#4A6CFF]';

  return (
    <div>
      {manage ? (
        <PageHeader
          section="Inventario"
          title="Inventario industrial"
          subtitle="Edita fichas del inventario. Los cambios se reflejan en lista y mapa."
          actions={(
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {filtered.length} propiedades
            </span>
          )}
        />
      ) : (
        <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Catálogo público / Propiedades</p>
            <h2 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-[#0E1A3D]">
              Propiedades industriales
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Consulta disponibilidad sin iniciar sesión.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {filtered.length} propiedades
          </span>
        </div>
      )}

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

      <div className={`grid gap-4 ${manage ? 'lg:grid-cols-[minmax(0,1fr)_minmax(300px,34%)_minmax(280px,30%)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)]'}`}>
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
                <div className="grid grid-cols-[120px_1fr] gap-0 sm:grid-cols-[180px_1fr]">
                  <div className="relative min-h-[120px]">
                    <img src={l.imageUrl} alt="" className="h-full min-h-[120px] w-full object-cover" />
                    {l.listedByLogoUrl !== undefined && (
                      <span className="absolute bottom-2 left-2 rounded-md bg-white/95 p-1 shadow-sm ring-1 ring-slate-200/80">
                        <img src={l.listedByLogoUrl} alt="" className="h-6 w-auto max-w-[72px] object-contain" />
                      </span>
                    )}
                  </div>
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
                    <div className="mt-2 flex items-center gap-2">
                      {l.listedByLogoUrl !== undefined && (
                        <img src={l.listedByLogoUrl} alt="" className="h-7 w-auto max-w-[88px] rounded object-contain ring-1 ring-slate-100" />
                      )}
                      <p className="text-[10px] font-semibold text-slate-400">Listed by {l.listedBy}</p>
                    </div>
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

        {manage && selected !== null && draft !== null && (
          <div className="sticky top-[4.5rem] max-h-[calc(100vh-200px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Editar ficha</p>
            <p className="mt-0.5 text-sm font-extrabold text-[#0E1A3D]">{selected.code}</p>
            <div className="mt-3 space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Título</span>
                <input className={inputCls} value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Precio (etiqueta)</span>
                <input className={inputCls} value={draft.priceLabel ?? ''} onChange={(e) => setDraft({ ...draft, priceLabel: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Área m²</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={String(draft.areaM2 ?? '')}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setDraft({ ...draft, areaM2: Number.isFinite(n) ? n : 0 });
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Tipo de operación</span>
                <select
                  className={inputCls}
                  value={draft.dealType ?? 'RENT'}
                  onChange={(e) => setDraft({ ...draft, dealType: e.target.value as ListingDealType })}
                >
                  <option value="RENT">Renta</option>
                  <option value="SALE">Venta</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Disponibilidad</span>
                <select
                  className={inputCls}
                  value={draft.availabilityState ?? 'AVAILABLE'}
                  onChange={(e) => setDraft({ ...draft, availabilityState: e.target.value as AvailabilityState })}
                >
                  {AVAIL.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Listed by</span>
                <input className={inputCls} value={draft.listedBy ?? ''} onChange={(e) => setDraft({ ...draft, listedBy: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Municipio</span>
                <input className={inputCls} value={draft.municipality ?? ''} onChange={(e) => setDraft({ ...draft, municipality: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Corredor</span>
                <input className={inputCls} value={draft.corridor ?? ''} onChange={(e) => setDraft({ ...draft, corridor: e.target.value })} />
              </label>
            </div>
            <button
              type="button"
              onClick={saveDraft}
              className="mt-4 w-full rounded-xl bg-[#0E1A3D] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#152552]"
            >
              Guardar cambios
            </button>
            {savedFlash && (
              <p className="mt-2 text-center text-[11px] font-bold text-emerald-600">✓ Guardado en inventario</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
