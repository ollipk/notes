import { useCallback, useState } from 'react';

/** Notation sizes relative to fit-to-width; the middle one is the default. */
export const ZOOM_SCALES = [0.75, 0.9, 1, 1.1, 1.25] as const;
const DEFAULT_LEVEL = 2;
export const ZOOM_STORAGE_KEY = 'notes.zoom';

function readLevel(): number {
  try {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
    const level = Number(stored);
    return stored !== null && Number.isInteger(level) && level >= 0 && level < ZOOM_SCALES.length
      ? level
      : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

/** The notation size on this device, remembered in localStorage when it is available. */
export function useZoom() {
  const [level, setLevelState] = useState(readLevel);

  const setLevel = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), ZOOM_SCALES.length - 1);
    setLevelState(clamped);
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
    } catch {
      // Private browsing or storage disabled: the zoom still works for this visit.
    }
  }, []);

  return {
    level,
    scale: ZOOM_SCALES[level] ?? 1,
    canZoomOut: level > 0,
    canZoomIn: level < ZOOM_SCALES.length - 1,
    zoomOut: () => setLevel(level - 1),
    zoomIn: () => setLevel(level + 1),
  };
}
