import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Building, Land, Park } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';
import { Card, CardBody, StatusBadge } from '../../components/ui/primitives.js';

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const GDL: [number, number] = [-103.33, 20.62];

function pinColor(status: Park['status']): string {
  if (status === 'VERIFIED') return '#0E1A3D';
  if (status === 'PENDING_VALIDATION') return '#FF7A00';
  return '#94a3b8';
}

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fCorridor, setFCorridor] = useState<string>('ALL');
  const [fStatus, setFStatus] = useState<string>('ALL');
  const [fClass, setFClass] = useState<string>('ALL');
  const [fAvail, setFAvail] = useState<string>('ALL');

  const corridors = useMemo(() => [...new Set(parks.map((p) => p.corridor))], [parks]);

  const filtered = useMemo(() => {
    return parks.filter((p) => {
      if (fCorridor !== 'ALL' && p.corridor !== fCorridor) return false;
      if (fStatus !== 'ALL' && p.status !== fStatus) return false;
      const kids = buildings.filter((b) => b.parkId === p.id);
      if (fClass !== 'ALL' && !kids.some((b) => b.buildingClass === fClass)) return false;
      if (fAvail !== 'ALL' && !kids.some((b) => b.availabilityState === fAvail)) return false;
      return p.lat !== undefined && p.lng !== undefined;
    });
  }, [parks, buildings, fCorridor, fStatus, fClass, fAvail]);

  const selected = parks.find((p) => p.id === selectedId) ?? null;
  const selBuildings = selected ? buildings.filter((b) => b.parkId === selected.id) : [];
  const selLands = selected ? lands.filter((l) => l.parkId === selected.id) : [];
  const selAvailable = selBuildings
    .filter((b) => b.availabilityState === 'AVAILABLE')
    .reduce((s, b) => s + b.netRentableM2, 0);

  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (mapRef.current === null || mapObj.current !== null) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_URL,
      center: GDL,
      zoom: 10,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => setTileState('ready'));
    map.on('error', () => setTileState('error'));
    mapObj.current = map;
    return () => {
      map.remove();
      mapObj.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (map === null) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    filtered.forEach((p) => {
      if (p.lat === undefined || p.lng === undefined) return;
      const el = document.createElement('button');
      el.type = 'button';
      el.title = p.name;
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '9999px';
      el.style.background = pinColor(p.status);
      el.style.border = '2.5px solid #fff';
      el.style.boxShadow = '0 1px 6px rgba(11,25,44,.45)';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => setSelectedId(p.id));
      const mk = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      markers.current.push(mk);
    });
    if (filtered.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filtered.forEach((p) => {
        if (p.lat !== undefined && p.lng !== undefined) bounds.extend([p.lng, p.lat]);
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [filtered]);

  const selCls = 'w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-blue';

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardBody>
          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <select className={selCls} value={fCorridor} onChange={(e) => setFCorridor(e.target.value)}>
              <option value="ALL">Corredor: todos</option>
              {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={selCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="ALL">Estatus: todos</option>
              <option value="VERIFIED">Verificado</option>
              <option value="PENDING_VALIDATION">En revisión</option>
              <option value="DRAFT">Borrador</option>
            </select>
            <select className={selCls} value={fClass} onChange={(e) => setFClass(e.target.value)}>
              <option value="ALL">Clase: todas</option>
              <option value="A">Clase A</option>
              <option value="A-">Clase A-</option>
              <option value="B">Clase B</option>
            </select>
            <select className={selCls} value={fAvail} onChange={(e) => setFAvail(e.target.value)}>
              <option value="ALL">Disponibilidad: toda</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="LEASED">Ocupada</option>
              <option value="UNDER_CONSTRUCTION">En construcción</option>
            </select>
          </div>
          <div className="relative">
            <div ref={mapRef} className="h-[480px] w-full overflow-hidden rounded-xl ring-1 ring-slate-200" />
            {tileState !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-100/90 p-6 text-center">
                {tileState === 'loading' ? (
                  <>
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-blue" />
                    <p className="text-xs font-bold text-slate-600">Cargando tiles del mapa…</p>
                    <p className="text-[11px] text-slate-400">Los pines aparecen en cuanto el estilo termina de cargar.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-700">Mapa sin conexión a tiles</p>
                    <p className="max-w-xs text-xs text-slate-500">
                      No se pudo cargar el estilo base (red). Usa los filtros y la ficha lateral: los datos de pines siguen disponibles abajo.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#0E1A3D' }} /> Verificado</span>
            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#FF7A00' }} /> En revisión</span>
            <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#94a3b8' }} /> Borrador</span>
            <span className="ml-auto">{filtered.length} parques visibles (de {parks.length})</span>
          </div>
          {tileState === 'error' && (
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`flex items-center gap-2 rounded-xl p-2 text-left text-xs font-bold ring-1 transition hover:shadow-sm ${selectedId === p.id ? 'bg-[#0B192C] text-white ring-[#0B192C]' : 'bg-white text-slate-700 ring-slate-200'}`}
                >
                  <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pinColor(p.status) }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {selected === null && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-brand-navy">Corredores industriales de Jalisco</p>
              <p className="mt-1 text-xs text-slate-500">Toca un pin para ver ficha técnica, infraestructura y naves hijas.</p>
            </div>
          )}
          {selected !== null && (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">{selected.corridor} · {selected.municipality}</p>
                  <h3 className="text-sm font-extrabold text-[#0B192C]">{selected.name}</h3>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2"><dt className="text-slate-400">Total</dt><dd className="font-bold">{formatAreaM2(selected.totalLandM2)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-2"><dt className="text-slate-400">Disponible (naves)</dt><dd className="font-bold text-brand-emerald">{formatAreaM2(selAvailable)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-2"><dt className="text-slate-400">Desarrollado</dt><dd className="font-bold">{formatAreaM2(selected.developedM2)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-2"><dt className="text-slate-400">Reserva</dt><dd className="font-bold">{formatAreaM2(selected.reserveM2)}</dd></div>
              </dl>
              <h4 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Infraestructura</h4>
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
                  <li key={label} className={`rounded-lg px-2 py-1 font-semibold ${ok === true ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-slate-100 text-slate-400'}`}>
                    {ok === true ? '✓ ' : '✕ '}{label}
                  </li>
                ))}
              </ul>
              <h4 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Naves ({selBuildings.length})</h4>
              <ul className="space-y-1.5">
                {selBuildings.map((b) => (
                  <li key={b.id} className="rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{b.code} · Clase {b.buildingClass}</span>
                      <span className="text-slate-400">{b.availabilityState}</span>
                    </div>
                    <p className="text-slate-500">
                      {formatAreaM2(b.netRentableM2)} · {formatUsdM2(b.askingRentUsdM2)} ·{' '}
                      {isStaff && b.occupantCompany !== undefined ? (
                        <span className="font-semibold text-[#0B192C]">{b.occupantCompany}</span>
                      ) : (
                        <span>{b.occupantAlias ?? '—'}</span>
                      )}
                    </p>
                  </li>
                ))}
                {selBuildings.length === 0 && <li className="text-xs text-slate-400">Sin naves registradas.</li>}
              </ul>
              {selLands.length > 0 && (
                <>
                  <h4 className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Terrenos ({selLands.length})</h4>
                  <ul className="space-y-1.5">
                    {selLands.map((l) => (
                      <li key={l.id} className="rounded-xl bg-slate-50 p-2 text-xs text-slate-600 ring-1 ring-slate-100">
                        <span className="font-bold">{l.name}</span> · {formatAreaM2(l.sellableM2)} vendibles
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {!isStaff && (
                <p className="mt-3 rounded-xl bg-slate-100 p-2 text-[11px] text-slate-500">Razones sociales reales ocultas por política de visibilidad.</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
