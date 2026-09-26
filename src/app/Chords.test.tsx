import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChordEvent } from '../domain/chordChart';
import en from '../locales/en.json';
import type { AbcAdapter, Player, Score } from '../ui/abc/types';
import { SETTINGS_STORAGE_KEY } from '../ui/settings';
import { App } from './App';
import i18n from './i18n';

// jsdom cannot render abcjs, so the adapter is replaced with a fake that records its calls.
const fake = vi.hoisted(() => {
  const player = {
    play: vi.fn(),
    pause: vi.fn(),
    restart: vi.fn(),
    setTempo: vi.fn(),
    dispose: vi.fn(),
  };
  const adapter = {
    renderScore: vi.fn(),
    supportsAudio: vi.fn(),
    createPlayer: vi.fn(),
    chordEvents: vi.fn(),
  };
  return { player, adapter };
});
vi.mock('../ui/abc/loadAbc', () => ({
  loadAbc: () => Promise.resolve(fake.adapter as AbcAdapter),
}));

// Every sample tune has chords, so the catalog gets one melody-only tune for these tests.
vi.mock('./catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./catalog')>();
  const melodyOnly = [
    'X: 1',
    'T: Plain Melody',
    'R: waltz',
    'O: FI',
    'S: Test fixture',
    'Z: Test',
    'M: 3/4',
    'L: 1/8',
    'K: D',
    '|:"^slow"D2 F2 A2|d6:|',
  ].join('\n');
  return {
    ...actual,
    catalog: [
      ...actual.catalog,
      ...actual.loadCatalog({ '/tunes/plain-melody/plain-melody.abc': melodyOnly }),
    ],
  };
});

/** `|: G | D :| |: C | | [1 D :| [2 G |` as chord events, in G major. */
const KESH_EVENTS: ChordEvent[] = [
  { kind: 'repeatStart' },
  { kind: 'chord', value: 'G' },
  { kind: 'bar' },
  { kind: 'chord', value: 'D' },
  { kind: 'repeatEnd' },
  { kind: 'bar' },
  { kind: 'repeatStart' },
  { kind: 'chord', value: 'C' },
  { kind: 'bar' },
  { kind: 'bar' },
  { kind: 'ending', value: '1' },
  { kind: 'chord', value: 'D/F♯' },
  { kind: 'repeatEnd' },
  { kind: 'bar' },
  { kind: 'ending', value: '2' },
  { kind: 'chord', value: 'Em' },
  { kind: 'chord', value: 'G' },
  { kind: 'bar' },
];

function open(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

const bar = () => screen.getByRole('group', { name: en.tune.controls });
const viewButton = () => within(bar()).getByRole('button', { name: /^View: / });
const openView = () => fireEvent.click(viewButton());
const viewSheet = () => screen.getByRole('dialog', { name: en.view.title });
const radio = (name: string) => within(viewSheet()).getByRole('radio', { name });
const capoSwitch = () => within(viewSheet()).getByRole('switch', { name: en.view.capoShapes });
const chart = (title = 'The Kesh') =>
  screen.findByRole('region', { name: en.chart.label.replace('{{title}}', title) });
const score = (title = 'The Kesh') =>
  screen.getByRole('img', { name: en.score.label.replace('{{title}}', title) });
const stored = () => JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? 'null') as unknown;
const storeSettings = (settings: object) =>
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 1, ...settings }));
/** The chord text of every bar of a chart, row by row. */
const bars = (region: HTMLElement) =>
  within(region)
    .getAllByRole('listitem')
    .map((item) => item.textContent);
const lastRenderedAbc = () => String(fake.adapter.renderScore.mock.lastCall?.[1]);

describe('chords', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('en'));
    vi.clearAllMocks();
    fake.adapter.renderScore.mockReturnValue({} as Score);
    fake.adapter.supportsAudio.mockReturnValue(true);
    fake.adapter.createPlayer.mockReturnValue(fake.player as Player);
    fake.adapter.chordEvents.mockReturnValue(KESH_EVENTS);
    fake.player.play.mockResolvedValue(undefined);
  });

  it('opens the View sheet from the bottom bar, with the display and playback modes', () => {
    open('#/tune/the-kesh');
    expect(viewButton()).toHaveAccessibleName('View: Notes + chords');

    openView();

    expect(viewSheet()).toHaveFocus();
    expect(radio(en.view.display.notesAndChords)).toBeChecked();
    expect(radio(en.view.playback.melody)).toBeChecked();
    expect(capoSwitch()).not.toBeChecked();
    for (const name of [...Object.values(en.view.display), ...Object.values(en.view.playback)]) {
      if (name === en.view.display.label || name === en.view.playback.label) continue;
      expect(within(viewSheet()).getByRole('radio', { name })).toBeEnabled();
    }
    expect(within(viewSheet()).queryByText(en.view.noChords)).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(viewButton()).toHaveFocus();
  });

  it('shows the chord chart at once, and keeps it for every tune after a reload', async () => {
    const { unmount } = open('#/tune/the-kesh?st=2');
    await waitFor(() => expect(fake.adapter.renderScore).toHaveBeenCalled());
    openView();

    fireEvent.click(radio(en.view.display.chordChart));

    expect(await chart()).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Sheet music/ })).not.toBeInTheDocument();
    expect(viewButton()).toHaveAccessibleName('View: Chord chart');
    expect(stored()).toMatchObject({ version: 1, displayMode: 'chordChart' });
    // A shared link carries only the tune, variant and transposition.
    expect(window.location.hash).toBe('#/tune/the-kesh?st=2');

    unmount();
    open('#/tune/drowsy-maggie');
    expect(await chart('Drowsy Maggie')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/tune/drowsy-maggie');
  });

  it('switches back to notes in two taps and hides the chord symbols', async () => {
    storeSettings({ displayMode: 'chordChart' });
    open('#/tune/the-kesh');
    await chart();

    openView();
    fireEvent.click(radio(en.view.display.notes));

    expect(score()).toBeInTheDocument();
    await waitFor(() => expect(fake.adapter.renderScore).toHaveBeenCalled());
    expect(lastRenderedAbc()).toContain('G3 GAB');
    expect(lastRenderedAbc()).not.toMatch(/"[A-G]/);
    expect(stored()).toMatchObject({ displayMode: 'notes' });
  });

  it('keeps the chord symbols in the score in notes and chords mode', async () => {
    open('#/tune/the-kesh');
    await waitFor(() => expect(fake.adapter.renderScore).toHaveBeenCalled());
    expect(lastRenderedAbc()).toContain('"G"');
  });

  it('draws parts and bars from the chord events, transposed with the URL', async () => {
    storeSettings({ displayMode: 'chordChart' });
    open('#/tune/the-kesh?st=3');

    const region = await chart();
    expect(fake.adapter.chordEvents).toHaveBeenCalledWith(expect.stringContaining('GAB'));
    expect(
      within(region)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['A', 'B']);
    // G major up 3 semitones is B♭ major.
    expect(bars(region)).toEqual(['‖:B♭', 'F:‖', '‖:E♭', 'E♭', '1.F/A:‖', '2.GmB♭']);
    const carried = within(region).getAllByRole('listitem')[3];
    expect(carried?.querySelector('.text-stone-400')).toHaveTextContent('E♭');
    expect(within(region).getAllByRole('img', { name: en.chart.repeatStart })).toHaveLength(2);
    expect(within(region).getByLabelText('Ending 2')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('shows capo shapes and the capo banner above the chart', async () => {
    storeSettings({ displayMode: 'chordChart', capoShapes: true });
    open('#/tune/the-kesh?st=3');

    const region = await chart();
    const banner = screen.getByRole('note');
    expect(banner).toHaveTextContent('Capo 3 · play G shapes');
    expect(banner.compareDocumentPosition(region)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(bars(region)).toEqual(['‖:G', 'D:‖', '‖:C', 'C', '1.D/F♯:‖', '2.EmG']);
  });

  it('shows no banner when no capo is needed', async () => {
    storeSettings({ displayMode: 'chordChart', capoShapes: true });
    open('#/tune/the-kesh?st=2');

    const region = await chart();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(bars(region)[0]).toBe('‖:A');
  });

  it('keeps the sounding chords in the score with the capo banner above it', async () => {
    storeSettings({ capoShapes: true });
    open('#/tune/the-kesh?st=3');

    expect(screen.getByRole('note')).toHaveTextContent('Capo 3 · play G shapes');
    await waitFor(() =>
      expect(fake.adapter.renderScore).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.stringContaining('"G"'),
        expect.objectContaining({ semitones: 3 }),
      ),
    );
  });

  it('turns capo shapes on from the View sheet', async () => {
    storeSettings({ displayMode: 'chordChart' });
    open('#/tune/the-kesh?st=3');
    await chart();
    openView();

    fireEvent.click(capoSwitch());

    expect(capoSwitch()).toBeChecked();
    expect(screen.getByRole('note')).toHaveTextContent('Capo 3 · play G shapes');
    expect(stored()).toMatchObject({ capoShapes: true });
  });

  it('disables the chord options for a tune without chords, keeping the stored choice', async () => {
    storeSettings({
      displayMode: 'chordChart',
      playbackMode: 'accompanimentOnly',
      capoShapes: true,
    });
    open('#/tune/plain-melody');

    expect(screen.getByText(en.view.noChords)).toHaveAttribute('role', 'status');
    expect(score('Plain Melody')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Chord chart/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    openView();
    expect(within(viewSheet()).getByText(en.view.noChords)).toBeInTheDocument();
    expect(radio(en.view.display.notes)).toBeEnabled();
    expect(radio(en.view.display.notesAndChords)).toBeDisabled();
    expect(radio(en.view.display.chordChart)).toBeDisabled();
    expect(radio(en.view.playback.melody)).toBeEnabled();
    expect(radio(en.view.playback.melodyAndAccompaniment)).toBeDisabled();
    expect(radio(en.view.playback.accompanimentOnly)).toBeDisabled();
    expect(capoSwitch()).toBeDisabled();

    // The melody plays; the stored accompaniment choice waits for a tune with chords.
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(within(bar()).getByRole('button', { name: en.player.play })).toBeEnabled(),
    );
    fireEvent.click(within(bar()).getByRole('button', { name: en.player.play }));
    await waitFor(() => expect(fake.player.play).toHaveBeenCalled());
    expect(fake.adapter.createPlayer).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ playback: 'melody' }),
    );
    expect(stored()).toEqual({
      version: 1,
      displayMode: 'chordChart',
      playbackMode: 'accompanimentOnly',
      capoShapes: true,
    });
  });

  it('plays the accompaniment alone, with its chords, in the displayed key', async () => {
    open('#/tune/the-kesh?st=3');
    openView();
    fireEvent.click(radio(en.view.playback.accompanimentOnly));
    fireEvent.keyDown(document, { key: 'Escape' });
    const play = within(bar()).getByRole('button', { name: en.player.play });
    await waitFor(() => expect(play).toBeEnabled());

    fireEvent.click(play);

    await waitFor(() => expect(fake.player.play).toHaveBeenCalled());
    expect(fake.adapter.createPlayer).toHaveBeenCalledWith(
      expect.stringContaining('"G"'),
      expect.objectContaining({ semitones: 3, playback: 'accompanimentOnly' }),
    );
    expect(stored()).toMatchObject({ playbackMode: 'accompanimentOnly' });
  });

  it('plays chords even when the score hides them', async () => {
    storeSettings({ displayMode: 'notes', playbackMode: 'melodyAndAccompaniment' });
    open('#/tune/the-kesh');
    const play = within(bar()).getByRole('button', { name: en.player.play });
    await waitFor(() => expect(play).toBeEnabled());

    fireEvent.click(play);

    await waitFor(() => expect(fake.player.play).toHaveBeenCalled());
    expect(fake.adapter.createPlayer).toHaveBeenCalledWith(
      expect.stringContaining('"G"'),
      expect.objectContaining({ playback: 'melodyAndAccompaniment' }),
    );
  });

  it('marks tunes with chords in the search results', () => {
    open('#/');

    const rows = within(screen.getByRole('region', { name: en.catalog.heading })).getAllByRole(
      'listitem',
    );
    const withBadge = rows
      .filter((row) => within(row).queryByText(en.search.chordsBadge))
      .map((row) => row.querySelector('a > span')?.textContent);
    expect(withBadge).toEqual(['Drowsy Maggie', 'Greensleeves', 'Hårgalåten', 'The Kesh']);
    expect(rows).toHaveLength(5);
  });
});
