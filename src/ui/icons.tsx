import type { ReactNode } from 'react';

/** Decorative icons. The button around each one carries a translated aria-label. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor" />
  </Icon>
);

export const RestartIcon = () => (
  <Icon>
    <path d="M6 5v14M19 5l-9 7 9 7z" />
  </Icon>
);

export const MinusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const ZoomOutIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35M8 11h6" />
  </Icon>
);

export const ZoomInIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const BackIcon = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const MoreIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </Icon>
);

export const FullScreenIcon = () => (
  <Icon>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Icon>
);

export const ExitFullScreenIcon = () => (
  <Icon>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </Icon>
);

export const PrintIcon = () => (
  <Icon>
    <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" />
    <path d="M7 14h10v6H7z" />
  </Icon>
);

/** Display mode "notes": a single note. */
export const NotesIcon = () => (
  <Icon>
    <ellipse cx="9" cy="17" rx="3.5" ry="2.5" fill="currentColor" />
    <path d="M12.5 17V4l6 2.5" />
  </Icon>
);

/** Display mode "notes and chords": a note with a chord symbol above. */
export const NotesChordsIcon = () => (
  <Icon>
    <ellipse cx="8" cy="18.5" rx="3" ry="2" fill="currentColor" />
    <path d="M11 18.5V10" />
    <path d="M20 4.5a3 3 0 1 0 0 5" />
  </Icon>
);

/** Display mode "chord chart": a grid of bars. */
export const ChordChartIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M9 5v14M15 5v14M3 12h18" />
  </Icon>
);
