import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCatalog } from './catalog';

const VALID = `X:1
T:A Tune
R:reel
O:IE
S:Test
Z:Test
M:4/4
L:1/8
K:D
DEFG ABcd|`;

describe('loadCatalog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the catalog from files keyed by their glob path', () => {
    const catalog = loadCatalog({ '/tunes/a-tune/a.abc': VALID, '/tunes/a-tune/b.abc': VALID });

    expect(catalog.map((tune) => [tune.id, tune.variants.length])).toEqual([['a-tune', 2]]);
  });

  it('logs and skips files that fail to parse', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const catalog = loadCatalog({
      '/tunes/a-tune/a.abc': VALID,
      '/tunes/broken/a.abc': VALID.replace('R:reel', 'R:polkka'),
    });

    expect(catalog.map((tune) => tune.id)).toEqual(['a-tune']);
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]?.[0]).toContain('tunes/broken/a.abc:3 R: "polkka"');
  });
});
