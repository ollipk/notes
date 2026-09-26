import { err, ok, type Result } from './result';
import type { TuneType } from './tuneType';

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Folder name of a tune in `tunes/`, e.g. `the-kesh`. */
export type TuneId = Brand<string, 'TuneId'>;
/** File name (without `.abc`) of a variant inside a tune folder, e.g. `standard`. */
export type VariantId = Brand<string, 'VariantId'>;

export interface Origin {
  /** ISO 3166-1 alpha-2 country code, e.g. `FI`. */
  country: string;
  region?: string;
}

/** One setting of a tune: a single `tunes/<tune-id>/<variant-id>.abc` file. */
export interface TuneVariant {
  tuneId: TuneId;
  variantId: VariantId;
  /** The first title is the primary title; the rest are alternate titles. */
  titles: readonly [string, ...string[]];
  composer?: string;
  type: TuneType;
  origin: Origin;
  source: string;
  transcriber: string;
  notes: readonly string[];
  meter: string;
  unitLength: string;
  tempo?: string;
  key: string;
  /** The full file text. */
  abc: string;
}

/** A tune and all its variants, ordered by variant ID. */
export interface Tune {
  id: TuneId;
  variants: readonly [TuneVariant, ...TuneVariant[]];
}

export interface ValidationError {
  path: string;
  line?: number;
  field?: string;
  message: string;
}

/** Tune and variant IDs: lowercase ASCII kebab-case. */
export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const TUNE_PATH_PATTERN = /^tunes\/([^/]+)\/([^/]+)\.abc$/;

/** Derives the tune and variant IDs from a path like `tunes/<tune-id>/<variant-id>.abc`. */
export function parseTunePath(
  path: string,
): Result<{ tuneId: TuneId; variantId: VariantId }, ValidationError> {
  const match = TUNE_PATH_PATTERN.exec(path);
  const tuneId = match?.[1];
  const variantId = match?.[2];
  if (tuneId === undefined || variantId === undefined) {
    return err({
      path,
      message:
        'Tune files must be at tunes/<tune-id>/<variant-id>.abc, one folder per tune and one file per variant.',
    });
  }
  const invalid = [
    ['tune ID (folder name)', tuneId],
    ['variant ID (file name)', variantId],
  ].filter(([, id]) => !ID_PATTERN.test(id ?? ''));
  if (invalid.length > 0) {
    return err({
      path,
      message: invalid
        .map(
          ([what, id]) =>
            `The ${what} "${id}" must be lowercase ASCII kebab-case, e.g. "the-kesh".`,
        )
        .join(' '),
    });
  }
  return ok({ tuneId: tuneId as TuneId, variantId: variantId as VariantId });
}

/** Formats an error as `path:line F: message`, the way editors and CI logs expect. */
export function formatValidationError(error: ValidationError): string {
  const location = error.line === undefined ? error.path : `${error.path}:${error.line}`;
  const field = error.field === undefined ? '' : ` ${error.field}:`;
  return `${location}${field} ${error.message}`;
}
