/** Shared control styles. Every control is at least 48×48 px for touch. */
const controlBase =
  'min-h-12 rounded-lg border border-stone-300 bg-white text-base text-stone-900 focus:ring-2 focus:ring-amber-600 focus:outline-none disabled:opacity-40 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100';

export const controlClass = `${controlBase} px-3`;

/** A button with an icon and a text label. */
export const textButtonClass = `${controlBase} inline-flex items-center gap-2 px-4`;

export const iconButtonClass = `${controlBase} inline-flex min-w-12 items-center justify-center px-2`;

/** An icon button without a border, e.g. "back" in the header. */
export const plainIconButtonClass =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-600 focus:outline-none dark:text-stone-100';

export const labelClass = 'text-sm font-medium text-stone-700 dark:text-stone-300';

export const linkClass =
  'inline-flex min-h-12 items-center self-start font-medium text-amber-800 underline-offset-4 hover:underline focus:ring-2 focus:ring-amber-600 focus:outline-none dark:text-amber-400';
