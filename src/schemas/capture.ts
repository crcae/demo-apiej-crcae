// Frontend capture contracts (Zod 4). Adapted from apps/api capture.schemas
// for mock IDs (non-UUID) and demo form payloads.
import { z } from 'zod';

const id = z.string().min(1, 'Campo obligatorio');

export const parkDraftSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(160),
    municipality: z.string().min(2, 'Municipio obligatorio').max(120),
    totalLandM2: z.number().nonnegative('La superficie total no puede ser negativa'),
    developedM2: z.number().nonnegative('La superficie desarrollada no puede ser negativa'),
    reserveM2: z.number().nonnegative('La reserva no puede ser negativa'),
  })
  .refine((d) => Math.abs(d.totalLandM2 - (d.developedM2 + d.reserveM2)) < 0.01, {
    message: 'Total debe ser igual a desarrollada + reserva territorial',
    path: ['totalLandM2'],
  });

export const buildingDraftSchema = z
  .object({
    parkId: id,
    code: z.string().min(1, 'Código obligatorio').max(60),
    buildingClass: z.enum(['A', 'A-', 'B', 'C']),
    totalGrossM2: z.number().nonnegative('La superficie bruta no puede ser negativa'),
    netRentableM2: z.number().positive('La superficie rentable debe ser mayor a 0'),
    clearHeightM: z.number().positive().max(30).optional(),
    dockDoors: z.number().int().nonnegative(),
    ramps: z.number().int().nonnegative(),
    powerKva: z.number().nonnegative().optional(),
    hasGas: z.boolean(),
    hasCrane: z.boolean(),
    availabilityState: z.enum([
      'AVAILABLE',
      'RESERVED',
      'LEASED',
      'SOLD',
      'UNDER_CONSTRUCTION',
      'OFF_MARKET',
    ]),
    askingRentUsdM2: z.number().nonnegative().optional(),
    visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).default('PRIVATE'),
  })
  .refine((d) => d.netRentableM2 <= d.totalGrossM2, {
    message: 'La superficie rentable no puede superar la bruta',
    path: ['netRentableM2'],
  });

export const landDraftSchema = z
  .object({
    name: z.string().min(2, 'Nombre obligatorio').max(160),
    totalM2: z.number().nonnegative(),
    sellableM2: z.number().nonnegative(),
    priceSaleUsdM2: z.number().nonnegative().optional(),
  })
  .refine((d) => d.sellableM2 <= d.totalM2, {
    message: 'Lo vendible no puede superar el total',
    path: ['sellableM2'],
  });

export type ParkDraft = z.infer<typeof parkDraftSchema>;
export type BuildingDraft = z.infer<typeof buildingDraftSchema>;
export type LandDraft = z.infer<typeof landDraftSchema>;

/** Map Zod issues to field → Spanish message for form UI. */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (out[key] === undefined) out[key] = issue.message;
  }
  return out;
}

/** First form-level or field message for a single banner. */
export function firstZodMessage(error: z.ZodError): string {
  const map = formatZodErrors(error);
  return map._form ?? Object.values(map)[0] ?? 'Revisa los datos del formulario.';
}
