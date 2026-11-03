import { describe, expect, it } from 'vitest';
import { FX_FALLBACK, resolveFx } from './fxService.js';

describe('resolveFx', () => {
  it('prefers live over frozen', () => {
    expect(resolveFx(17.5, 17.12)).toBe(17.5);
  });

  it('uses frozen when live is null', () => {
    expect(resolveFx(null, 17.12)).toBe(17.12);
  });

  it('falls back when both missing', () => {
    expect(resolveFx(null, undefined)).toBe(FX_FALLBACK);
  });
});
