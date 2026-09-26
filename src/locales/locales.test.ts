import { describe, expect, it } from 'vitest';
import en from './en.json';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Flattens nested locale objects into dotted keys, e.g. `home.comingSoon`. */
function flattenKeys(value: Json, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const locales = import.meta.glob<Json>('./*.json', { eager: true, import: 'default' });
const enKeys = flattenKeys(en).sort();
const otherLocales = Object.entries(locales).filter(([path]) => path !== './en.json');

describe('locale files', () => {
  it('include at least one locale besides en', () => {
    expect(otherLocales.length).toBeGreaterThan(0);
  });

  describe.each(otherLocales)('%s', (_path, messages) => {
    const keys = flattenKeys(messages);

    it('has every key in en.json', () => {
      expect(enKeys.filter((key) => !keys.includes(key))).toEqual([]);
    });

    it('has no keys missing from en.json', () => {
      expect(keys.filter((key) => !enKeys.includes(key))).toEqual([]);
    });
  });
});
