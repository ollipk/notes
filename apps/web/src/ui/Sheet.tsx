import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';
import { iconButtonClass } from './styles';

interface SheetProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A bottom sheet over the page, within thumb reach. Closes with its close button, a tap on the
 * backdrop or Escape. Not a native `<dialog>`: jsdom has no `showModal()`.
 */
export function Sheet({ label, onClose, children }: SheetProps) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end print:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('sheet.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="relative mx-auto flex max-h-[85dvh] w-full max-w-3xl flex-col gap-5 overflow-y-auto rounded-t-2xl bg-stone-50 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl focus:outline-none dark:bg-stone-900"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={t('sheet.close')}
            onClick={onClose}
            className={iconButtonClass}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
