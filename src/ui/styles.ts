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

export const legendClass = `${labelClass} mb-1`;

export const linkClass =
  'inline-flex min-h-12 items-center self-start font-medium text-amber-800 underline-offset-4 hover:underline focus:ring-2 focus:ring-amber-600 focus:outline-none dark:text-amber-400';

/** One option of a segmented control: a label around a visually hidden radio button. */
export const segmentClass =
  'flex min-h-12 flex-1 cursor-pointer items-center justify-center px-2 py-1 text-center text-sm font-medium text-stone-900 has-checked:bg-amber-700 has-checked:text-white has-disabled:cursor-not-allowed has-disabled:opacity-40 has-focus-visible:ring-2 has-focus-visible:ring-amber-600 has-focus-visible:ring-inset dark:text-stone-100 dark:has-checked:bg-amber-500 dark:has-checked:text-stone-950';

export const segmentGroupClass =
  'flex divide-x divide-stone-300 overflow-hidden rounded-lg border border-stone-300 bg-white dark:divide-stone-600 dark:border-stone-600 dark:bg-stone-800';

/** A switch: a checkbox drawn as a sliding toggle, in a full-width 48 px row. */
export const switchRowClass =
  'flex min-h-12 cursor-pointer items-center justify-between gap-4 text-base has-disabled:cursor-not-allowed has-disabled:opacity-40';

export const switchClass =
  'relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-stone-400 transition-colors before:absolute before:top-1 before:left-1 before:size-5 before:rounded-full before:bg-white before:transition-transform checked:bg-amber-700 checked:before:translate-x-5 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed dark:bg-stone-600 dark:checked:bg-amber-500';
