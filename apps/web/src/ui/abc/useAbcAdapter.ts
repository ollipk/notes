import { useEffect, useState } from 'react';
import { loadAbc } from './loadAbc';
import type { AbcAdapter } from './types';

export type AbcAdapterState =
  { status: 'loading' } | { status: 'ready'; adapter: AbcAdapter } | { status: 'error' };

/** Loads the abcjs adapter when a component that needs it mounts. */
export function useAbcAdapter(): AbcAdapterState {
  const [state, setState] = useState<AbcAdapterState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadAbc().then(
      (adapter) => {
        if (active) setState({ status: 'ready', adapter });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return state;
}
