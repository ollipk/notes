import type { Tune, TuneId, TuneVariant } from './tune';

// Root collation: the same order for every user, whatever their language.
const titleCollator = new Intl.Collator('und');

const compareCodeUnits = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Groups variants into tunes. Variants are ordered by variant ID, tunes by the primary title
 * of their first variant (then by tune ID).
 */
export function buildCatalog(variants: readonly TuneVariant[]): Tune[] {
  const groups = new Map<TuneId, TuneVariant[]>();
  for (const variant of variants) {
    groups.set(variant.tuneId, [...(groups.get(variant.tuneId) ?? []), variant]);
  }

  const tunes: Tune[] = [];
  for (const [id, group] of groups) {
    const [first, ...rest] = group.sort((a, b) => compareCodeUnits(a.variantId, b.variantId));
    if (first !== undefined) {
      tunes.push({ id, variants: [first, ...rest] });
    }
  }

  return tunes.sort(compareTunes);
}

/** Catalog order: by the primary title of the first variant, then by tune ID. */
export function compareTunes(a: Tune, b: Tune): number {
  return (
    titleCollator.compare(a.variants[0].titles[0], b.variants[0].titles[0]) ||
    compareCodeUnits(a.id, b.id)
  );
}
