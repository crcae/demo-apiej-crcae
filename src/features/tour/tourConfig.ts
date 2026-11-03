import type { DemoPersonaKey } from '../../types/domain.js';

export type TourStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const TOUR_TOTAL = 10;

export type TourView =
  | 'dashboard'
  | 'mapa'
  | 'inventario'
  | 'captura'
  | 'validacion'
  | 'reportes'
  | 'auditoria';

/** Runtime action keys resolved in App (need live state / handlers). */
export type TourActionKey =
  | 'toggleCurrency'
  | 'showQ2'
  | 'showQ1'
  | 'approveFirst'
  | 'openReports'
  | 'openMap'
  | 'switchAlpha'
  | 'switchBeta'
  | 'switchStaff'
  | 'newBuilding'
  | 'restartTour';

export interface TourStepDef {
  id: TourStepId;
  title: string;
  text: string;
  view: TourView;
  persona: DemoPersonaKey;
  periodId?: string;
  spotlight?: boolean;
  flash: string;
  actionKeys: TourActionKey[];
}

export const TOUR_STEPS: Record<TourStepId, TourStepDef> = {
  1: {
    id: 1,
    title: 'Dashboard · panorama y FX',
    text: 'KPIs de inventario, vacancia, absorción y renta. Q1 está congelado para auditoría. Cambia USD/MXN para ver el tipo de cambio en vivo.',
    view: 'dashboard',
    persona: 'STAFF',
    periodId: 'p-2026-q1',
    flash: 'Paso 1 · Dashboard: prueba USD ↔ MXN y el badge de FX.',
    actionKeys: ['toggleCurrency', 'showQ2'],
  },
  2: {
    id: 2,
    title: 'Multi-tenant · roles',
    text: 'Cada organización ve solo su inventario. Cambia a Dev Alpha o Dev Beta y compara: el aislamiento es inmediato en KPIs, mapa y listas.',
    view: 'dashboard',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    flash: 'Paso 2 · Prueba Alpha/Beta: multi-tenant en vivo.',
    actionKeys: ['switchAlpha', 'switchBeta', 'switchStaff'],
  },
  3: {
    id: 3,
    title: 'Inventario industrial',
    text: 'Catálogo editable del sistema (lista + mapa). Ajusta título, precio, m² y disponibilidad. El público consulta solo lectura en /propiedades.',
    view: 'inventario',
    persona: 'STAFF',
    flash: 'Paso 3 · Inventario: edita una ficha en el panel derecho.',
    actionKeys: [],
  },
  4: {
    id: 4,
    title: 'Mapa GIS',
    text: 'Corredores de la ZMG, parques y naves. Filtra por estatus, cambia basemap y abre la ficha técnica de un parque.',
    view: 'mapa',
    persona: 'STAFF',
    flash: 'Paso 4 · Mapa: explora corredores y pines.',
    actionKeys: [],
  },
  5: {
    id: 5,
    title: 'Captura de datos',
    text: 'Alta de parques, naves y terrenos. Guarda borrador o envía a revisión. El wizard de naves guía el alta completa.',
    view: 'captura',
    persona: 'STAFF',
    flash: 'Paso 5 · Captura: abre el wizard de naves si quieres.',
    actionKeys: ['newBuilding'],
  },
  6: {
    id: 6,
    title: 'Validación · bandeja Staff',
    text: 'Como Staff revisas pendientes: aprueba, pide cambios o rechaza. El primer registro queda resaltado durante el tour.',
    view: 'validacion',
    persona: 'STAFF',
    spotlight: true,
    flash: 'Paso 6 · Validación: revisa la bandeja de pendientes.',
    actionKeys: [],
  },
  7: {
    id: 7,
    title: 'Aprobar y recalcular Q2',
    text: 'Aprueba la primera pendiente: vacancia y absorción de Q2 se recalculan en vivo. Q1 permanece intacto (snapshot de auditoría).',
    view: 'validacion',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    spotlight: true,
    flash: 'Paso 7 · Pulsa «Aprobar 1ª pendiente» para ver el recálculo.',
    actionKeys: ['approveFirst'],
  },
  8: {
    id: 8,
    title: 'Reportes PDF',
    text: 'Dos plantillas: resumen ejecutivo trimestral y Observatorio PCI/PCP. Selecciona una y descarga el PDF activo.',
    view: 'reportes',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    flash: 'Paso 8 · Reportes: elige una plantilla y descarga.',
    actionKeys: ['openReports'],
  },
  9: {
    id: 9,
    title: 'Auditoría',
    text: 'Historial de quién cambió qué y cuándo. Trazabilidad completa para gobernanza y compliance del observatorio.',
    view: 'auditoria',
    persona: 'STAFF',
    flash: 'Paso 9 · Auditoría: consulta el historial de cambios.',
    actionKeys: [],
  },
  10: {
    id: 10,
    title: 'Listo · cierre del tour',
    text: 'Recorriste Dashboard, roles, Inventario, Mapa, Captura, Validación, Reportes y Auditoría. Reinicia el tour cuando quieras desde este botón.',
    view: 'dashboard',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    flash: 'Paso 10 · Tour completo. Finaliza o reinicia cuando quieras.',
    actionKeys: ['restartTour', 'showQ1'],
  },
};

export function isTourStepId(n: number): n is TourStepId {
  return Number.isInteger(n) && n >= 1 && n <= TOUR_TOTAL;
}
