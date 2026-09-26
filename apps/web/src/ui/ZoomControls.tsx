import { useTranslation } from 'react-i18next';
import { ZoomInIcon, ZoomOutIcon } from './icons';
import { iconButtonClass } from './styles';

interface ZoomControlsProps {
  canZoomOut: boolean;
  canZoomIn: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
}

export function ZoomControls({ canZoomOut, canZoomIn, onZoomOut, onZoomIn }: ZoomControlsProps) {
  const { t } = useTranslation();

  return (
    <div role="group" aria-label={t('zoom.label')} className="flex gap-2">
      <button
        type="button"
        aria-label={t('zoom.out')}
        disabled={!canZoomOut}
        onClick={onZoomOut}
        className={iconButtonClass}
      >
        <ZoomOutIcon />
      </button>
      <button
        type="button"
        aria-label={t('zoom.in')}
        disabled={!canZoomIn}
        onClick={onZoomIn}
        className={iconButtonClass}
      >
        <ZoomInIcon />
      </button>
    </div>
  );
}
