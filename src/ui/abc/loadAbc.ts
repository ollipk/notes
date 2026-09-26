import type { AbcAdapter } from './types';

let loading: Promise<AbcAdapter> | undefined;

/** Loads abcjs on demand, so it is not part of the home page bundle. */
export function loadAbc(): Promise<AbcAdapter> {
  loading ??= import('./abcjsAdapter').then(
    (module) => module.abcjsAdapter,
    (error: unknown) => {
      // Let a later call retry, e.g. after the network comes back.
      loading = undefined;
      throw error;
    },
  );
  return loading;
}
