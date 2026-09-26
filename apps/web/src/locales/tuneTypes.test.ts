import { describe, expect, it } from 'vitest';
import { TUNE_TYPES } from '@notes/domain';
import en from './en.json';

// Other locales are covered by the key parity test in locales.test.ts.
describe('tune type labels in en.json', () => {
  const labelled = Object.keys(en.tuneType);

  it('exist for every tune type in the vocabulary', () => {
    expect(TUNE_TYPES.filter((id) => !labelled.includes(id))).toEqual([]);
  });

  it('exist only for tune types in the vocabulary', () => {
    expect(labelled.filter((id) => !(TUNE_TYPES as readonly string[]).includes(id))).toEqual([]);
  });
});
