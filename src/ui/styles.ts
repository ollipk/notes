/** Shared control styles. Every control is at least 44×44 px for touch. */
const controlBase =
  'min-h-11 rounded-lg border border-stone-300 bg-white text-base text-stone-900 focus:ring-2 focus:ring-amber-600 focus:outline-none disabled:opacity-40 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100';

export const controlClass = `${controlBase} px-3`;

export const iconButtonClass = `${controlBase} inline-flex min-w-11 items-center justify-center px-2`;

export const labelClass = 'text-sm font-medium text-stone-700 dark:text-stone-300';

export const linkClass =
  'inline-flex min-h-11 items-center self-start font-medium text-amber-800 underline-offset-4 hover:underline focus:ring-2 focus:ring-amber-600 focus:outline-none dark:text-amber-400';
