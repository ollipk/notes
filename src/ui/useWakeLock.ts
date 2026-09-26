import { useEffect } from 'react';

/**
 * Keeps the screen on while the component is mounted, where the browser supports the Screen Wake
 * Lock API. The browser drops the lock when the page is hidden, so it is requested again when the
 * page becomes visible. Unsupported or refused: nothing happens.
 */
export function useWakeLock() {
  useEffect(() => {
    const wakeLock = (navigator as Partial<Navigator>).wakeLock;
    if (!wakeLock) return;
    let sentinel: WakeLockSentinel | undefined;
    let active = true;

    const request = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        const next = await wakeLock.request('screen');
        if (active) sentinel = next;
        else void next.release().catch(() => {});
      } catch {
        // Denied, e.g. battery saver or no permission: the page still works.
      }
    };

    const onVisibilityChange = () => void request();
    document.addEventListener('visibilitychange', onVisibilityChange);
    void request();

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, []);
}
