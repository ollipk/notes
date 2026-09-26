import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { RestartIcon } from './icons';
import { controlClass, iconButtonClass, labelClass } from './styles';

/** Tempo choices in percent of the written tempo. Slower is the main learning feature. */
export const TEMPOS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120] as const;

interface TempoControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  canRestart: boolean;
  onRestart: () => void;
}

/** Tempo and "back to the start", in the "More" sheet. */
export function TempoControls({ tempo, onTempoChange, canRestart, onRestart }: TempoControlsProps) {
  const { t, i18n } = useTranslation();
  const tempoId = useId();
  const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: 'percent' });

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={tempoId} className={labelClass}>
        {t('player.tempo')}
      </label>
      <div className="flex gap-2">
        <select
          id={tempoId}
          value={tempo}
          onChange={(event) => onTempoChange(Number(event.target.value))}
          className={controlClass}
        >
          {TEMPOS.map((value) => (
            <option key={value} value={value}>
              {percent.format(value / 100)}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={t('player.restart')}
          disabled={!canRestart}
          onClick={onRestart}
          className={iconButtonClass}
        >
          <RestartIcon />
        </button>
      </div>
    </div>
  );
}
