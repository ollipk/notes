import { compareTunes } from './catalog';
import type { Tune } from './tune';
import type { TuneType } from './tuneType';

/**
 * Letters that NFD does not decompose but that players type without the stroke or ligature,
 * e.g. "sonderho" for "Sønderho".
 */
const FOLDS: Readonly<Record<string, string>> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ł: 'l',
  đ: 'd',
  ß: 'ss',
};

/** Lowercase, without diacritics, with single spaces: "Säkkijärvi  Polkka" → "sakkijarvi polkka". */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[øæœłđß]/g, (letter) => FOLDS[letter] ?? letter)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match quality, best first. */
const Rank = { PrimaryTitleStarts: 0, TitleStarts: 1, TitleWordStarts: 2, Other: 3 } as const;

function rank(
  tune: Tune,
  query: string,
  words: readonly string[],
  typeLabel: (type: TuneType) => string,
) {
  const titles = [...new Set(tune.variants.flatMap(({ titles }) => titles))].map(
    normalizeSearchText,
  );
  const fields = [
    ...titles,
    ...tune.variants.flatMap(({ origin, type }) => [
      ...(origin.region === undefined ? [] : [normalizeSearchText(origin.region)]),
      normalizeSearchText(typeLabel(type)),
    ]),
  ];
  if (!words.every((word) => fields.some((field) => field.includes(word)))) return undefined;

  if (normalizeSearchText(tune.variants[0].titles[0]).startsWith(query)) {
    return Rank.PrimaryTitleStarts;
  }
  if (titles.some((title) => title.startsWith(query))) return Rank.TitleStarts;
  const titleWords = titles.flatMap((title) => title.split(' '));
  if (titleWords.some((titleWord) => words.some((word) => titleWord.startsWith(word)))) {
    return Rank.TitleWordStarts;
  }
  return Rank.Other;
}

/**
 * Finds tunes by title (any variant, alternate titles included), region or tune type, ignoring
 * case and diacritics. Every word of the query must match somewhere. Tunes whose title starts
 * with the query come first; ties keep catalog (alphabetical) order.
 *
 * `typeLabel` gives the tune type's name in the user's language, so the domain stays i18n-free.
 */
export function searchTunes(
  catalog: readonly Tune[],
  query: string,
  typeLabel: (type: TuneType) => string,
): Tune[] {
  const normalized = normalizeSearchText(query);
  if (normalized === '') return [...catalog].sort(compareTunes);
  const words = normalized.split(' ');

  return catalog
    .flatMap((tune) => {
      const tuneRank = rank(tune, normalized, words, typeLabel);
      return tuneRank === undefined ? [] : [{ tune, rank: tuneRank }];
    })
    .sort((a, b) => a.rank - b.rank || compareTunes(a.tune, b.tune))
    .map(({ tune }) => tune);
}
