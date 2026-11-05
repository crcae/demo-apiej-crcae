/** Real developer / park operator logos for landing + listing cards. */
const LOGO_BY_LISTED_BY: Record<string, string> = {
  AXIS: '/logos/axis.png',
  VESTA: '/logos/vesta.png',
  Bexalta: '/logos/bexalta.png',
  ELITE: '/logos/elite.png',
  'Developer Alpha': '/logos/alpha.svg',
  'Developer Beta': '/logos/beta.svg',
  'APIEJ Market': '/logos/apiej-market.svg',
};

export function logoUrlForListedBy(listedBy: string): string | undefined {
  return LOGO_BY_LISTED_BY[listedBy];
}

export interface CollaboratorBrand {
  name: string;
  sub: string;
  logoUrl: string;
  /** When true, logo already includes brand name — hide redundant title. */
  wordmark?: boolean;
  /** Prefer dark tile behind logo (white marks). */
  darkTile?: boolean;
}

/** Primary collaborators shown on the landing ecosystem strip. */
export const COLLABORATOR_BRANDS: CollaboratorBrand[] = [
  { name: 'AXIS', sub: 'Parque Industrial', logoUrl: '/logos/axis.png', wordmark: true },
  { name: 'Bexalta', sub: 'Inmobiliaria Inteligente', logoUrl: '/logos/bexalta.png', wordmark: true },
  { name: 'VESTA', sub: 'Industrial REIT', logoUrl: '/logos/vesta.png', wordmark: true },
  { name: 'ELITE', sub: 'Last Mile Parks', logoUrl: '/logos/elite.png', wordmark: true, darkTile: true },
];
