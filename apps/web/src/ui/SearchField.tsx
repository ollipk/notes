import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter: open the first result. */
  onSubmit: () => void;
}

/**
 * The home page's search field. It takes focus when the page opens, so a player can start
 * typing straight away (on phones the browser may still wait for a tap to show the keyboard).
 */
export function SearchField({ value, onChange, onSubmit }: SearchFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-1"
    >
      <label htmlFor={id} className="sr-only">
        {t('search.label')}
      </label>
      <div className="relative">
        <input
          ref={input}
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('search.placeholder')}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          className="min-h-14 w-full rounded-xl border-2 border-stone-300 bg-white py-3 pr-14 pl-4 text-xl text-stone-900 placeholder:text-stone-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== '' && (
          <button
            type="button"
            aria-label={t('search.clear')}
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
            className="absolute inset-y-0 right-1 my-auto inline-flex size-12 items-center justify-center rounded-lg text-stone-600 focus:ring-2 focus:ring-amber-600 focus:outline-none dark:text-stone-300"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </form>
  );
}
