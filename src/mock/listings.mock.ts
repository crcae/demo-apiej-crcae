import type { IndustrialListing } from '../types/domain.js';

const IMG_A = '/Industrial%20Logistics%20Park%20at%20Sunset.png';
const IMG_B = '/ChatGPT%20Image%20Oct%206,%202026%20at%2006_46_28%20PM.png';

/** Demo inventory for Inventario Industrial (lista + mapa). */
export const mockListings: IndustrialListing[] = [
  {
    id: 'lst-01', code: 'AP-SU1021', title: 'Nave clase A disponible · Parque El Salto',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$6.50 USD/m² · RENTA',
    areaM2: 11800, municipality: 'El Salto', corridor: 'ES-TL-IM', listedBy: 'Developer Alpha',
    imageUrl: IMG_A, lat: 20.523, lng: -103.194, buildingClass: 'A', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-02', code: 'AP-SU1022', title: 'Nave en construcción · ampliación El Salto',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$6.90 USD/m² · PRE-ARRIENDO',
    areaM2: 14500, municipality: 'El Salto', corridor: 'ES-TL-IM', listedBy: 'Developer Alpha',
    imageUrl: IMG_B, lat: 20.525, lng: -103.190, buildingClass: 'A', availabilityState: 'UNDER_CONSTRUCTION',
  },
  {
    id: 'lst-03', code: 'AP-TR2001', title: 'Macrolote industrial vendible · El Salto',
    dealType: 'SALE', propertyType: 'LAND', priceLabel: '$85 USD/m² · VENTA',
    areaM2: 42000, municipality: 'El Salto', corridor: 'ES-TL-IM', listedBy: 'Developer Alpha',
    imageUrl: IMG_A, lat: 20.518, lng: -103.198, availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-04', code: 'AP-SU3104', title: 'Nave clase B · Zapopan Logistics',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$5.80 USD/m² · RENTA',
    areaM2: 6100, municipality: 'Zapopan', corridor: 'Zapopan Norte', listedBy: 'Developer Beta',
    imageUrl: IMG_B, lat: 20.726, lng: -103.400, buildingClass: 'B', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-05', code: 'AP-SU3105', title: 'Nave clase A ocupada · ficha de mercado',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$7.20 USD/m² · REFERENCIA',
    areaM2: 19200, municipality: 'Zapopan', corridor: 'Zapopan Norte', listedBy: 'Developer Beta',
    imageUrl: IMG_A, lat: 20.722, lng: -103.405, buildingClass: 'A', availabilityState: 'LEASED',
  },
  {
    id: 'lst-06', code: 'AP-TR3108', title: 'Lote de reserva · Zapopan Norte',
    dealType: 'SALE', propertyType: 'LAND', priceLabel: '$110 USD/m² · VENTA',
    areaM2: 28000, municipality: 'Zapopan', corridor: 'Zapopan Norte', listedBy: 'Developer Beta',
    imageUrl: IMG_B, lat: 20.730, lng: -103.395, availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-07', code: 'AP-SU4501', title: 'Nave Periférico Sur · disponible',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$5.40 USD/m² · RENTA',
    areaM2: 9300, municipality: 'Tlaquepaque', corridor: 'Periférico Sur', listedBy: 'Developer Beta',
    imageUrl: IMG_A, lat: 20.604, lng: -103.356, buildingClass: 'B', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-08', code: 'AP-SU4502', title: 'Cross-dock López Mateos Sur',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$6.10 USD/m² · RENTA',
    areaM2: 8200, municipality: 'Tlajomulco', corridor: 'López Mateos Sur', listedBy: 'AXIS',
    imageUrl: IMG_B, lat: 20.55, lng: -103.448, buildingClass: 'A-', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-09', code: 'AP-SU4503', title: 'Nave CMS · Circuito Metropolitano Sur',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$5.95 USD/m² · RENTA',
    areaM2: 10400, municipality: 'Tlaquepaque', corridor: 'Circuito Metropolitano Sur', listedBy: 'VESTA',
    imageUrl: IMG_A, lat: 20.512, lng: -103.34, buildingClass: 'A', availabilityState: 'RESERVED',
  },
  {
    id: 'lst-10', code: 'AP-SU4504', title: 'Bodega Colima-Acatlán · preventa',
    dealType: 'SALE', propertyType: 'BUILDING', priceLabel: '$980 USD/m² · VENTA',
    areaM2: 5600, municipality: 'Tlajomulco', corridor: 'Carretera a Colima-Acatlán', listedBy: 'ELITE',
    imageUrl: IMG_B, lat: 20.48, lng: -103.48, buildingClass: 'B', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-11', code: 'AP-SU4505', title: 'Nave Tonalá-Zapotlanejo · last mile',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$6.40 USD/m² · RENTA',
    areaM2: 4800, municipality: 'Tonalá', corridor: 'Tonalá-Zapotlanejo', listedBy: 'Bexalta',
    imageUrl: IMG_A, lat: 20.625, lng: -103.16, buildingClass: 'A', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-12', code: 'AP-SU4506', title: 'Espacio AZI · Antigua Zona Industrial',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$4.90 USD/m² · RENTA',
    areaM2: 3200, municipality: 'Guadalajara', corridor: 'Antigua Zona Industrial', listedBy: 'APIEJ Market',
    imageUrl: IMG_B, lat: 20.662, lng: -103.335, buildingClass: 'C', availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-13', code: 'AP-TR4507', title: 'Terreno industrial · corredor Tala',
    dealType: 'SALE', propertyType: 'LAND', priceLabel: '$72 USD/m² · VENTA',
    areaM2: 35000, municipality: 'Tala', corridor: 'Tala', listedBy: 'Developer Alpha',
    imageUrl: IMG_A, lat: 20.66, lng: -103.58, availabilityState: 'AVAILABLE',
  },
  {
    id: 'lst-14', code: 'AP-SU4508', title: 'Nave especulativa · ES-TL-IM rama aeropuerto',
    dealType: 'RENT', propertyType: 'WAREHOUSE', priceLabel: '$6.75 USD/m² · RENTA',
    areaM2: 15600, municipality: 'El Salto', corridor: 'ES-TL-IM', listedBy: 'AXIS',
    imageUrl: IMG_B, lat: 20.505, lng: -103.22, buildingClass: 'A', availabilityState: 'AVAILABLE',
  },
];
