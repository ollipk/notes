import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { DISPLAY_MODES, PLAYBACK_MODES, type DisplayMode, type PlayerSettings } from './settings';
import {
  legendClass,
  segmentClass,
  segmentGroupClass,
  switchClass,
  switchRowClass,
} from './styles';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  optionLabel: (option: T) => string;
  isDisabled: (option: T) => boolean;
  onChange: (option: T) => void;
}

/** A row of mutually exclusive options: radio buttons drawn as segments. */
function SegmentedControl<T extends string>({
  label,
  options,
  value,
  optionLabel,
  isDisabled,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={legendClass}>{label}</legend>
      <div className={segmentGroupClass}>
        {options.map((option) => (
          <label key={option} className={segmentClass}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={option === value}
              disabled={isDisabled(option)}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {optionLabel(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ViewControlsProps {
  settings: PlayerSettings;
  onChange: (changes: Partial<PlayerSettings>) => void;
  /** Whether the tune has chord symbols. Without them the chord options are disabled. */
  hasChords: boolean;
}

/**
 * The View sheet's contents: how the tune is shown and played. Changes apply at once and are kept
 * on the device for every tune (ADR 10). A tune without chords disables the chord options but
 * leaves the stored choice alone, so the next tune with chords uses it.
 */
export function ViewControls({ settings, onChange, hasChords }: ViewControlsProps) {
  const { t } = useTranslation();
  const needsChords = (mode: DisplayMode | PlayerSettings['playbackMode']) =>
    !hasChords && mode !== 'notes' && mode !== 'melody';

  return (
    <div className="flex flex-col gap-5">
      {!hasChords && (
        <p role="note" className="text-stone-700 dark:text-stone-300">
          {t('view.noChords')}
        </p>
      )}
      <SegmentedControl
        label={t('view.display.label')}
        options={DISPLAY_MODES}
        value={settings.displayMode}
        optionLabel={(mode) => t(`view.display.${mode}`)}
        isDisabled={needsChords}
        onChange={(displayMode) => onChange({ displayMode })}
      />
      <SegmentedControl
        label={t('view.playback.label')}
        options={PLAYBACK_MODES}
        value={settings.playbackMode}
        optionLabel={(mode) => t(`view.playback.${mode}`)}
        isDisabled={needsChords}
        onChange={(playbackMode) => onChange({ playbackMode })}
      />
      <label className={switchRowClass}>
        {t('view.capoShapes')}
        <input
          type="checkbox"
          role="switch"
          checked={settings.capoShapes}
          disabled={!hasChords}
          onChange={(event) => onChange({ capoShapes: event.target.checked })}
          className={switchClass}
        />
      </label>
    </div>
  );
}
