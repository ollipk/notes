import { describe, expect, it } from 'vitest';
import { buildCatalog } from './catalog';
import { normalizeSearchText, searchTunes } from './search';
import type { TuneId, TuneVariant, VariantId } from './tune';
import type { TuneType } from './tuneType';

function variant(
  tuneId: string,
  titles: [string, ...string[]],
  { type = 'reel', region }: { type?: TuneType; region?: string } = {},
): TuneVariant {
  return {
    tuneId: tuneId as TuneId,
    variantId: 'a' as VariantId,
    titles,
    type,
    origin: region === undefined ? { country: 'FI' } : { country: 'FI', region },
    source: 'Test',
    transcriber: 'Test',
    notes: [],
    meter: '4/4',
    unitLength: '1/8',
    key: 'D',
    abc: '',
  };
}

const catalog = buildCatalog([
  variant('sakkijarven-polkka', ['Säkkijärven polkka'], { type: 'polka', region: 'Karjala' }),
  variant('hargalaten', ['Hårgalåten', 'The Hårga Tune'], {
    type: 'polska',
    region: 'Hälsingland',
  }),
  variant('sonderho', ['Sønderho bridal trip'], { type: 'other' }),
  variant('drowsy-maggie', ['Drowsy Maggie']),
  variant('the-kesh', ['The Kesh', 'The Kesh Jig'], { type: 'jig' }),
  variant('kesh-polka', ['Polka from Kesh'], { type: 'polka' }),
]);

const labels: Record<string, string> = {
  reel: 'Reel',
  jig: 'Jig',
  polka: 'Polkka',
  polska: 'Polska',
  other: 'Other',
};
const typeLabel = (type: TuneType) => labels[type] ?? type;
const search = (query: string) => searchTunes(catalog, query, typeLabel).map(({ id }) => id);

describe('normalizeSearchText', () => {
  it('drops case, diacritics and extra spaces', () => {
    expect(normalizeSearchText('  Säkkijärvi   ÅSA ')).toBe('sakkijarvi asa');
  });

  it('folds letters that do not decompose', () => {
    expect(normalizeSearchText('Sønderho Æble Łódź Straße')).toBe('sonderho aeble lodz strasse');
  });
});

describe('searchTunes', () => {
  it('returns the whole catalog alphabetically for an empty query', () => {
    expect(search('')).toEqual(catalog.map(({ id }) => id));
    expect(search('   ')).toHaveLength(catalog.length);
  });

  it('ignores case and diacritics on both sides', () => {
    expect(search('sakkijarven')).toEqual(['sakkijarven-polkka']);
    expect(search('SÄKKIJÄRVEN')).toEqual(['sakkijarven-polkka']);
    expect(search('hargalaten')).toEqual(['hargalaten']);
    expect(search('sonderho')).toEqual(['sonderho']);
  });

  it('matches alternate titles', () => {
    expect(search('harga tune')).toEqual(['hargalaten']);
  });

  it('matches the region and the translated tune type', () => {
    expect(search('halsingland')).toEqual(['hargalaten']);
    expect(search('polkka')).toEqual(['sakkijarven-polkka', 'kesh-polka']);
  });

  it('requires every word to match somewhere', () => {
    expect(search('polkka karjala')).toEqual(['sakkijarven-polkka']);
    expect(search('drowsy kesh')).toEqual([]);
  });

  it('returns nothing when nothing matches', () => {
    expect(search('xyz')).toEqual([]);
  });

  it('ranks primary title, then any title, then title word, then other matches', () => {
    // "the kesh": primary title starts with it.
    expect(search('the kesh')).toEqual(['the-kesh']);
    // "kesh": no title starts with it; "Polka from Kesh" and "The Kesh" have a word that does.
    expect(search('kesh')).toEqual(['kesh-polka', 'the-kesh']);
    // "the": the primary title "The Kesh" starts with it; for Hårgalåten only the alternate
    // title "The Hårga Tune" does; Sønderho matches only its type label "Other".
    expect(search('the')).toEqual(['the-kesh', 'hargalaten', 'sonderho']);
    // "polkka": a word in a title beats a match on the translated type alone.
    expect(search('polkka')).toEqual(['sakkijarven-polkka', 'kesh-polka']);
  });

  it('puts a title-start match before a match elsewhere', () => {
    const tunes = buildCatalog([
      variant('a-jig', ['Anything'], { type: 'jig' }),
      variant('jiggy', ['Jiggy Tune']),
    ]);
    expect(searchTunes(tunes, 'jig', typeLabel).map(({ id }) => id)).toEqual(['jiggy', 'a-jig']);
  });
});
