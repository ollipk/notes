import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { keyChoices, pitchClass, semitonesToKey, transposeKey, type Key } from '../domain/key';
import { MAX_SEMITONES, MIN_SEMITONES } from '../domain/transposition';
import { MinusIcon, PlusIcon } from './icons';
import { controlClass, iconButtonClass, labelClass } from './styles';
import { useKeyName } from './useKeyName';

interface TranspositionProps {
  /** The key in the file. */
  writtenKey: Key;
  semitones: number;
  onChange: (semitones: number) => void;
}

export const shownKey = (writtenKey: Key, semitones: number) =>
  semitones === 0 ? writtenKey : transposeKey(writtenKey, semitones);

/** "+2", "−3": the transposition in the user's number format. */
export function useOffsetText(): (semitones: number) => string {
  const { i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.resolvedLanguage, { signDisplay: 'exceptZero' });
  return (semitones) => format.format(semitones);
}

/** "Key: F♯ dorian (+2)": the displayed key as one line, e.g. for the printout. */
export function useKeyLine(): (writtenKey: Key, semitones: number) => string {
  const { t } = useTranslation();
  const keyName = useKeyName();
  const offset = useOffsetText();
  return (writtenKey, semitones) => {
    const key = keyName(shownKey(writtenKey, semitones));
    return semitones === 0
      ? t('transpose.current', { key })
      : t('transpose.currentShifted', { key, offset: offset(semitones) });
  };
}

/** −, the displayed key and +, for the bottom bar. */
export function KeyStepper({ writtenKey, semitones, onChange }: TranspositionProps) {
  const { t } = useTranslation();
  const keyName = useKeyName();
  const offset = useOffsetText();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        aria-label={t('transpose.down')}
        disabled={semitones <= MIN_SEMITONES}
        onClick={() => onChange(semitones - 1)}
        className={iconButtonClass}
      >
        <MinusIcon />
      </button>
      <div
        role="status"
        aria-label={t('transpose.label')}
        className="flex min-w-0 flex-1 flex-col items-center leading-tight"
      >
        <span className="max-w-full truncate text-lg font-semibold">
          {keyName(shownKey(writtenKey, semitones))}
        </span>
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {semitones === 0
            ? t('transpose.written')
            : t('transpose.offset', { offset: offset(semitones), count: Math.abs(semitones) })}
        </span>
      </div>
      <button
        type="button"
        aria-label={t('transpose.up')}
        disabled={semitones >= MAX_SEMITONES}
        onClick={() => onChange(semitones + 1)}
        className={iconButtonClass}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

/** The list of keys, and a way back to the written key, for the "More" sheet. */
export function KeyPicker({ writtenKey, semitones, onChange }: TranspositionProps) {
  const { t } = useTranslation();
  const keyName = useKeyName();
  const selectId = useId();
  const choices = keyChoices(writtenKey.mode);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className={labelClass}>
        {t('transpose.label')}
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id={selectId}
          value={pitchClass(shownKey(writtenKey, semitones).tonic)}
          onChange={(event) => {
            const target = choices[Number(event.target.value)];
            if (target) onChange(semitonesToKey(writtenKey, target.tonic));
          }}
          className={controlClass}
        >
          {choices.map((choice) => (
            <option key={pitchClass(choice.tonic)} value={pitchClass(choice.tonic)}>
              {keyName(choice)}
            </option>
          ))}
        </select>
        {semitones !== 0 && (
          <button type="button" onClick={() => onChange(0)} className={controlClass}>
            {t('transpose.reset')}
          </button>
        )}
      </div>
    </div>
  );
}
