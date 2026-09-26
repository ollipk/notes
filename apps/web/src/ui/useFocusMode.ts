import { useCallback, useEffect, useState } from 'react';

const leaveFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
};

/**
 * Focus mode: only the score, as large as the screen allows. Uses the Fullscreen API where the
 * browser has it (e.g. Android Chrome) and otherwise just fills the viewport with CSS (e.g.
 * iPhone Safari), which looks the same. Leaving browser full screen by the system gesture or
 * Escape also leaves focus mode. Not kept in the URL.
 */
export function useFocusMode() {
  const [active, setActive] = useState(false);

  const exit = useCallback(() => {
    setActive(false);
    leaveFullscreen();
  }, []);

  const enter = useCallback(() => {
    setActive(true);
    const root = document.documentElement;
    if (document.fullscreenEnabled && typeof root.requestFullscreen === 'function') {
      // If the browser refuses, the CSS focus mode is still on.
      root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setActive(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      leaveFullscreen();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    // In browser full screen the browser handles Escape itself; this covers the CSS mode.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exit();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, exit]);

  return { active, enter, exit };
}
