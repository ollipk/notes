/**
 * Per-device viewing preferences (ADR 10). They apply to every tune and are never written to the
 * URL: a shared link carries only the tune, variant and transposition.
 */

export const DISPLAY_MODES = ['notes', 'notesAndChords', 'chordChart'] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

export const PLAYBACK_MODES = ['melody', 'melodyAndAccompaniment', 'accompanimentOnly'] as const;
export type PlaybackMode = (typeof PLAYBACK_MODES)[number];

/** Notation sizes relative to fit-to-width; the middle one is the default. */
export const ZOOM_SCALES = [0.75, 0.9, 1, 1.1, 1.25] as const;

export interface PlayerSettings {
  displayMode: DisplayMode;
  playbackMode: PlaybackMode;
  /** Show chords as guitar shapes for a capo. */
  capoShapes: boolean;
  /** Index into `ZOOM_SCALES`. */
  zoomLevel: number;
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  displayMode: 'notesAndChords',
  playbackMode: 'melody',
  capoShapes: false,
  zoomLevel: 2,
};

export const SETTINGS_STORAGE_KEY = 'notes.settings';
export const SETTINGS_VERSION = 1;
/** Where the zoom level was kept before the settings module. */
export const LEGACY_ZOOM_STORAGE_KEY = 'notes.zoom';

const isZoomLevel = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < ZOOM_SCALES.length;

const oneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    values.includes(value as T);

/** Keeps each valid stored field and uses the default for the rest. */
function fromStored(stored: Record<string, unknown>): PlayerSettings {
  const pick = <K extends keyof PlayerSettings>(
    key: K,
    valid: (value: unknown) => value is PlayerSettings[K],
  ): PlayerSettings[K] => (valid(stored[key]) ? stored[key] : DEFAULT_SETTINGS[key]);
  return {
    displayMode: pick('displayMode', oneOf(DISPLAY_MODES)),
    playbackMode: pick('playbackMode', oneOf(PLAYBACK_MODES)),
    capoShapes: pick('capoShapes', (value): value is boolean => typeof value === 'boolean'),
    zoomLevel: pick('zoomLevel', isZoomLevel),
  };
}

/** The zoom level stored by earlier versions, which is then removed. */
function migrateLegacyZoom(): number | undefined {
  const stored = localStorage.getItem(LEGACY_ZOOM_STORAGE_KEY);
  if (stored === null) return undefined;
  localStorage.removeItem(LEGACY_ZOOM_STORAGE_KEY);
  const level = Number(stored);
  return isZoomLevel(level) ? level : undefined;
}

/**
 * The stored settings. Missing, corrupt or unknown-version data gives the defaults, and a zoom
 * level from before this module is carried over. Storage that cannot be read gives the defaults.
 */
export function readSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) {
      const zoomLevel = migrateLegacyZoom();
      const settings =
        zoomLevel === undefined ? DEFAULT_SETTINGS : { ...DEFAULT_SETTINGS, zoomLevel };
      if (zoomLevel !== undefined) writeSettings(settings);
      return settings;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== SETTINGS_VERSION
    ) {
      return DEFAULT_SETTINGS;
    }
    return fromStored(parsed as Record<string, unknown>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Stores the settings; without storage (private browsing) they last for this visit only. */
export function writeSettings(settings: PlayerSettings): void {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: SETTINGS_VERSION, ...settings }),
    );
  } catch {
    // Storage full or disabled: the settings still apply until the page is closed.
  }
}
