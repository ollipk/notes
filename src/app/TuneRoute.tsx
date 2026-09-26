import { useParams, useSearchParams } from 'react-router';
import type { Tune, VariantId } from '../domain/tune';
import { parseSemitones } from '../domain/transposition';
import { NotFound } from '../ui/NotFound';
import { TunePage } from '../ui/TunePage';
import { HOME_HREF } from './routes';

/**
 * `/#/tune/:tuneId?v=<variant-id>&st=<semitones>`. The URL is the single source of truth for the
 * variant and the transposition, so a shared link opens exactly the same score (ADR 8).
 */
export function TuneRoute({ tunes }: { tunes: readonly Tune[] }) {
  const { tuneId } = useParams();
  const [params, setParams] = useSearchParams();

  const tune = tunes.find(({ id }) => id === tuneId);
  const v = params.get('v');
  const variant =
    v === null ? tune?.variants[0] : tune?.variants.find(({ variantId }) => variantId === v);
  if (tune === undefined || variant === undefined) {
    return <NotFound homeHref={HOME_HREF} />;
  }

  const semitones = parseSemitones(params.get('st'));
  const update = (next: { variantId?: VariantId; semitones?: number }) => {
    // Always write v, so a shared link keeps its variant even if variants are added later.
    const query = new URLSearchParams({ v: next.variantId ?? variant.variantId });
    const st = next.semitones ?? semitones;
    if (st !== 0) query.set('st', String(st));
    setParams(query, { replace: true });
  };

  return (
    <TunePage
      key={tune.id}
      tune={tune}
      variant={variant}
      semitones={semitones}
      homeHref={HOME_HREF}
      onVariantChange={(variantId) => update({ variantId })}
      onSemitonesChange={(st) => update({ semitones: st })}
    />
  );
}
