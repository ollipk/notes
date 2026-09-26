import type { TuneId } from '../domain/tune';

/** Hash-router links (ADR 3). Plain `href`s, so src/ui does not depend on the router. */
export const HOME_HREF = '#/';

export const tunePath = (id: TuneId) => `/tune/${encodeURIComponent(id)}`;
export const tuneHref = (id: TuneId) => `#${tunePath(id)}`;
