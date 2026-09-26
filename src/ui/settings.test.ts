import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LEGACY_ZOOM_STORAGE_KEY,
  readSettings,
  SETTINGS_STORAGE_KEY,
  writeSettings,
  type PlayerSettings,
} from './settings';

const stored = () => JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? 'null') as unknown;

describe('player settings', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to notes and chords, melody, no capo, normal zoom', () => {
    expect(readSettings()).toEqual({
      displayMode: 'notesAndChords',
      playbackMode: 'melody',
      capoShapes: false,
      zoomLevel: 2,
    });
  });

  it('stores one versioned object and reads it back', () => {
    const settings: PlayerSettings = {
      displayMode: 'chordChart',
      playbackMode: 'accompanimentOnly',
      capoShapes: true,
      zoomLevel: 4,
    };
    writeSettings(settings);

    expect(stored()).toEqual({ version: 1, ...settings });
    expect(readSettings()).toEqual(settings);
  });

  it.each(['{not json', 'null', '"chordChart"', '[]'])('survives corrupt data: %s', (raw) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores an unknown version', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 99, displayMode: 'chordChart' }),
    );
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and defaults invalid ones', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, displayMode: 'chordChart', playbackMode: 'loud', zoomLevel: 9 }),
    );
    expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, displayMode: 'chordChart' });
  });

  it('migrates the old zoom value and removes it', () => {
    localStorage.setItem(LEGACY_ZOOM_STORAGE_KEY, '4');

    expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, zoomLevel: 4 });
    expect(localStorage.getItem(LEGACY_ZOOM_STORAGE_KEY)).toBeNull();
    expect(stored()).toEqual({ version: 1, ...DEFAULT_SETTINGS, zoomLevel: 4 });
  });

  it('drops an invalid old zoom value', () => {
    localStorage.setItem(LEGACY_ZOOM_STORAGE_KEY, 'huge');
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(LEGACY_ZOOM_STORAGE_KEY)).toBeNull();
  });

  it('uses the defaults when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => writeSettings(DEFAULT_SETTINGS)).not.toThrow();
  });
});
