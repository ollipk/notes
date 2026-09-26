import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { keyChoices, pitchClass, semitonesToKey, transposeKey, type Key } from '../domain/key';
import { MAX_SEMITONES, MIN_SEMITONES } from '../domain/transposition';
import { MinusIcon, PlusIcon } from './icons';
import { controlClass, iconButtonClass, labelClass } from './styles';
import { useKeyName } from './useKeyName';

interface TranspositionControlsProps {
  /** The key in the file. */
  writtenKey: Key;
  semitones: number;
  onChange: (semitones: number) => void;
}

export function TranspositionControls({
  writtenKey,
  semitones,
  onChange,
}: TranspositionControlsProps) {
  const { t, i18n } = useTranslation();
  const keyName = useKeyName();
  const selectId = useId();

  const shownKey = semitones === 0 ? writtenKey : transposeKey(writtenKey, semitones);
  const choices = keyChoices(writtenKey.mode);
  const offset = new Intl.NumberFormat(i18n.resolvedLanguage, {
    signDisplay: 'exceptZero',
  }).format(semitones);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={selectId} className={labelClass}>
            {t('transpose.label')}
          </label>
          <select
            id={selectId}
            value={pitchClass(shownKey.tonic)}
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
        </div>
        <button
          type="button"
          aria-label={t('transpose.down')}
          disabled={semitones <= MIN_SEMITONES}
          onClick={() => onChange(semitones - 1)}
          className={iconButtonClass}
        >
          <MinusIcon />
        </button>
        <button
          type="button"
          aria-label={t('transpose.up')}
          disabled={semitones >= MAX_SEMITONES}
          onClick={() => onChange(semitones + 1)}
          className={iconButtonClass}
        >
          <PlusIcon />
        </button>
        {semitones !== 0 && (
          <button type="button" onClick={() => onChange(0)} className={controlClass}>
            {t('transpose.reset')}
          </button>
        )}
      </div>
      <p aria-live="polite" className="font-medium">
        {semitones === 0
          ? t('transpose.current', { key: keyName(shownKey) })
          : t('transpose.currentShifted', { key: keyName(shownKey), offset })}
      </p>
    </div>
  );
}
