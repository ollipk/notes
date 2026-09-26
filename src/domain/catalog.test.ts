import { describe, expect, it } from 'vitest';
import { buildCatalog } from './catalog';
import type { TuneId, TuneVariant, VariantId } from './tune';

function variant(tuneId: string, variantId: string, title: string): TuneVariant {
  return {
    tuneId: tuneId as TuneId,
    variantId: variantId as VariantId,
    titles: [title],
    type: 'reel',
    origin: { country: 'IE' },
    source: 'Test',
    transcriber: 'Test',
    notes: [],
    meter: '4/4',
    unitLength: '1/8',
    key: 'D',
    abc: '',
  };
}

describe('buildCatalog', () => {
  it('returns an empty catalog for no variants', () => {
    expect(buildCatalog([])).toEqual([]);
  });

  it('groups variants by tune ID and orders them by variant ID', () => {
    const catalog = buildCatalog([
      variant('the-kesh', 'standard', 'The Kesh'),
      variant('drowsy-maggie', 'a', 'Drowsy Maggie'),
      variant('the-kesh', 'ornamented', 'The Kesh'),
    ]);

    expect(catalog.map((tune) => [tune.id, tune.variants.map((v) => v.variantId)])).toEqual([
      ['drowsy-maggie', ['a']],
      ['the-kesh', ['ornamented', 'standard']],
    ]);
  });

  it('orders tunes by the primary title of their first variant', () => {
    const catalog = buildCatalog([
      variant('b-tune', 'b', 'Zeta'),
      variant('b-tune', 'a', 'Alpha'),
      variant('a-tune', 'a', 'Beta'),
    ]);

    expect(catalog.map((tune) => tune.id)).toEqual(['b-tune', 'a-tune']);
  });

  it('sorts titles with accents and mixed case in a locale-independent order', () => {
    const catalog = buildCatalog([
      variant('soldiers-joy', 'a', "Soldier's Joy"),
      variant('hargalaten', 'a', 'Hårgalåten'),
      variant('greensleeves', 'a', 'greensleeves'),
      variant('ievan-polkka', 'a', 'Ievan polkka'),
    ]);

    expect(catalog.map((tune) => tune.variants[0].titles[0])).toEqual([
      'greensleeves',
      'Hårgalåten',
      'Ievan polkka',
      "Soldier's Joy",
    ]);
  });

  it('breaks ties between equal titles by tune ID', () => {
    const catalog = buildCatalog([variant('b', 'a', 'Same'), variant('a', 'a', 'Same')]);

    expect(catalog.map((tune) => tune.id)).toEqual(['a', 'b']);
  });
});
