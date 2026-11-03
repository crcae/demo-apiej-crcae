import type { DemoPersonaKey } from '../../types/domain.js';

export type TourStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TOUR_TOTAL = 8;

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
  | 'approveFirst'
  | 'openReports'
  | 'openMap'
  | 'switchBeta'
  | 'newBuilding';

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
    title: 'Dashboard · panorama del mercado',
    text: 'Aquí ves inventario, vacancia, absorción y renta. Q1 está congelado para auditoría; cambia USD/MXN para ver el tipo de cambio en vivo.',
    view: 'dashboard',
    persona: 'STAFF',
    periodId: 'p-2026-q1',
    flash: 'Paso 1 · Dashboard: prueba cambiar USD ↔ MXN.',
    actionKeys: ['toggleCurrency', 'showQ2'],
  },
  2: {
    id: 2,
    title: 'Inventario industrial',
    text: 'Catálogo editable del sistema: lista + mapa. Puedes ajustar título, precio, m² y disponibilidad. El público ve solo lectura en /propiedades.',
    view: 'inventario',
    persona: 'STAFF',
    flash: 'Paso 2 · Inventario: selecciona una ficha y edítala a la derecha.',
    actionKeys: [],
  },
  3: {
    id: 3,
    title: 'Mapa GIS',
    text: 'Corredores industriales de la ZMG, parques y naves. Filtra por estatus, cambia basemap y abre la ficha de un parque.',
    view: 'mapa',
    persona: 'STAFF',
    flash: 'Paso 3 · Mapa: explora corredores y pines.',
    actionKeys: [],
  },
  4: {
    id: 4,
    title: 'Captura de datos',
    text: 'Alta y edición de parques, naves y terrenos. Guarda borrador o envía a revisión para que Staff valide.',
    view: 'captura',
    persona: 'STAFF',
    flash: 'Paso 4 · Captura: puedes abrir el wizard de naves.',
    actionKeys: ['newBuilding'],
  },
  5: {
    id: 5,
    title: 'Bandeja de validación',
    text: 'Como Staff revisas lo pendiente: aprueba, pide cambios o rechaza. El primer registro queda resaltado durante el tour.',
    view: 'validacion',
    persona: 'STAFF',
    spotlight: true,
    flash: 'Paso 5 · Validación: revisa la bandeja de pendientes.',
    actionKeys: [],
  },
  6: {
    id: 6,
    title: 'Aprobar y recalcular Q2',
    text: 'Aprueba la primera pendiente: Q2 se recalcula en vivo (vacancia/absorción). Q1 permanece intacto.',
    view: 'validacion',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    spotlight: true,
    flash: 'Paso 6 · Pulsa «Aprobar 1ª pendiente» para ver el recálculo.',
    actionKeys: ['approveFirst'],
  },
  7: {
    id: 7,
    title: 'Reportes PDF',
    text: 'Dos plantillas descargables: resumen ejecutivo trimestral y Observatorio PCI/PCP. Selecciona y descarga el PDF activo.',
    view: 'reportes',
    persona: 'STAFF',
    periodId: 'p-2026-q2',
    flash: 'Paso 7 · Reportes: elige una plantilla y descarga PDF.',
    actionKeys: ['openReports'],
  },
  8: {
    id: 8,
    title: 'Auditoría',
    text: 'Historial de quién cambió qué y cuándo. Cierra el tour cuando quieras — puedes reiniciarlo desde el Dashboard.',
    view: 'auditoria',
    persona: 'STAFF',
    flash: 'Paso 8 · Auditoría: consulta el historial y finaliza el tour.',
    actionKeys: ['switchBeta', 'openMap'],
  },
};

export function isTourStepId(n: number): n is TourStepId {
  return Number.isInteger(n) && n >= 1 && n <= TOUR_TOTAL;
}
