import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { readSettings, writeSettings, type PlayerSettings } from './settings';

interface PlayerSettingsContextValue {
  settings: PlayerSettings;
  /** Changes some settings; they apply at once and are stored on the device. */
  update: (changes: Partial<PlayerSettings>) => void;
}

const PlayerSettingsContext = createContext<PlayerSettingsContextValue | null>(null);

/** Holds the device's player settings for every page below it. */
export function PlayerSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readSettings);

  const update = useCallback((changes: Partial<PlayerSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      writeSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <PlayerSettingsContext value={value}>{children}</PlayerSettingsContext>;
}

/** The device's player settings, the same way in every component. */
export function usePlayerSettings(): PlayerSettingsContextValue {
  const value = useContext(PlayerSettingsContext);
  if (value === null) throw new Error('usePlayerSettings needs a PlayerSettingsProvider');
  return value;
}
