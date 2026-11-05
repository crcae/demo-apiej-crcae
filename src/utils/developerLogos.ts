/** Developer / park operator wordmarks for landing + listing cards. */
const LOGO_BY_LISTED_BY: Record<string, string> = {
  AXIS: '/logos/axis.svg',
  VESTA: '/logos/vesta.svg',
  Bexalta: '/logos/bexalta.svg',
  ELITE: '/logos/elite.svg',
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
}

/** Primary collaborators shown on the landing ecosystem strip. */
export const COLLABORATOR_BRANDS: CollaboratorBrand[] = [
  { name: 'AXIS', sub: 'Parque Industrial', logoUrl: '/logos/axis.svg' },
  { name: 'Bexalta', sub: 'Inmobiliaria Inteligente', logoUrl: '/logos/bexalta.svg' },
  { name: 'VESTA', sub: 'Industrial REIT', logoUrl: '/logos/vesta.svg' },
  { name: 'ELITE', sub: 'Last Mile Parks', logoUrl: '/logos/elite.svg' },
];
