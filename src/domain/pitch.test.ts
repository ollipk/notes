import { describe, expect, it } from 'vitest';
import { semitonesUp } from './pitch';

describe('semitonesUp', () => {
  it('is zero for the same pitch class', () => {
    expect(semitonesUp(2, 2)).toBe(0);
  });

  it('counts upwards from D (2) to G (7)', () => {
    expect(semitonesUp(2, 7)).toBe(5);
  });

  it('wraps around the octave from A (9) to D (2)', () => {
    expect(semitonesUp(9, 2)).toBe(5);
  });

  it('accepts pitch classes outside 0–11', () => {
    expect(semitonesUp(-3, 14)).toBe(5);
  });
});
