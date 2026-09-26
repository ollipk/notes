import { usePlayerSettings } from './PlayerSettings';
import { ZOOM_SCALES } from './settings';

/** The notation size on this device, kept with the other player settings. */
export function useZoom() {
  const { settings, update } = usePlayerSettings();
  const level = settings.zoomLevel;
  const setLevel = (next: number) =>
    update({ zoomLevel: Math.min(Math.max(next, 0), ZOOM_SCALES.length - 1) });

  return {
    level,
    scale: ZOOM_SCALES[level] ?? 1,
    canZoomOut: level > 0,
    canZoomIn: level < ZOOM_SCALES.length - 1,
    zoomOut: () => setLevel(level - 1),
    zoomIn: () => setLevel(level + 1),
  };
}
