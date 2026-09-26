import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../locales/en.json';
import type { AbcAdapter, Player, Score } from '../ui/abc/types';
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
  const adapter = { renderScore: vi.fn(), supportsAudio: vi.fn(), createPlayer: vi.fn() };
  return { player, adapter };
});
vi.mock('../ui/abc/loadAbc', () => ({
  loadAbc: () => Promise.resolve(fake.adapter as AbcAdapter),
}));

function open(hash: string) {
  window.location.hash = hash;
  render(<App />);
}

/** The query string of the current hash route. */
const query = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '');

const keyText = () => screen.getByText(/^Key: /);
const upButton = () => screen.getByRole('button', { name: en.transpose.up });

describe('tune page', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('en'));
    vi.clearAllMocks();
    fake.adapter.renderScore.mockReturnValue({} as Score);
    fake.adapter.supportsAudio.mockReturnValue(true);
    fake.adapter.createPlayer.mockReturnValue(fake.player as Player);
    fake.player.play.mockResolvedValue(undefined);
    fake.player.setTempo.mockResolvedValue(undefined);
  });

  it('opens from the home list', async () => {
    open('#/');

    fireEvent.click(screen.getByRole('link', { name: /Drowsy Maggie/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Drowsy Maggie' }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/tune/drowsy-maggie');
    expect(screen.getByText('Reel')).toBeInTheDocument();
    expect(screen.getByText('Ireland')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.tune.back })).toHaveAttribute('href', '#/');
  });

  it('passes the transposition in the URL to the renderer and shows the key', async () => {
    open('#/tune/drowsy-maggie?st=2');

    await waitFor(() =>
      expect(fake.adapter.renderScore).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.stringContaining('K:'),
        expect.objectContaining({ semitones: 2 }),
      ),
    );
    expect(keyText()).toHaveTextContent('Key: F♯ dorian (+2)');
  });

  it('renders the score without the fields the page already shows', async () => {
    open('#/tune/drowsy-maggie');

    await waitFor(() => expect(fake.adapter.renderScore).toHaveBeenCalled());
    const abc = String(fake.adapter.renderScore.mock.calls[0]?.[1]);
    expect(abc).not.toMatch(/^[TCROSZN]:/m);
    expect(abc).toMatch(/^K:D$/m); // E dorian, written with its relative major's signature
    expect(keyText()).toHaveTextContent('Key: E dorian');
  });

  it('steps the transposition with the + button, up to 12', async () => {
    open('#/tune/the-kesh');
    expect(keyText()).toHaveTextContent('Key: G major');

    fireEvent.click(upButton());

    expect(query().get('st')).toBe('1');
    expect(query().get('v')).toBe('ornamented');
    expect(keyText()).toHaveTextContent('Key: A♭ major (+1)');
    await waitFor(() =>
      expect(fake.adapter.renderScore).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        expect.any(String),
        expect.objectContaining({ semitones: 1 }),
      ),
    );
  });

  it('disables + at 12 and − at −12', () => {
    open('#/tune/the-kesh?st=12');
    expect(upButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: en.transpose.down })).toBeEnabled();
    expect(keyText()).toHaveTextContent('Key: G major (+12)');
  });

  it('disables − at −12', () => {
    open('#/tune/the-kesh?st=-12');
    expect(screen.getByRole('button', { name: en.transpose.down })).toBeDisabled();
  });

  it('sets the nearest transposition when a key is picked', () => {
    open('#/tune/the-kesh');
    const select = screen.getByRole('combobox', { name: en.transpose.label });
    expect(within(select).getAllByRole('option')).toHaveLength(12);
    expect(select).toHaveDisplayValue('G major');

    fireEvent.change(select, { target: { value: '2' } }); // D major
    expect(query().get('st')).toBe('-5');
    expect(keyText()).toHaveTextContent('Key: D major (-5)');

    fireEvent.change(select, { target: { value: '1' } }); // D♭ major
    expect(query().get('st')).toBe('6');
    expect(screen.getByRole('combobox', { name: en.transpose.label })).toHaveDisplayValue(
      'D♭ major',
    );
  });

  it('shows the reset button only when transposed', () => {
    open('#/tune/the-kesh?st=3');

    fireEvent.click(screen.getByRole('button', { name: en.transpose.reset }));

    expect(query().has('st')).toBe(false);
    expect(keyText()).toHaveTextContent('Key: G major');
    expect(screen.queryByRole('button', { name: en.transpose.reset })).not.toBeInTheDocument();
  });

  it.each(['abc', '13', '-40', '1.5'])('ignores an invalid st=%s', (st) => {
    open(`#/tune/the-kesh?st=${st}`);
    expect(keyText()).toHaveTextContent(/^Key: G major$/);
  });

  it('shows the variant selector only for tunes with several variants', () => {
    open('#/tune/the-kesh?st=2');
    const select = screen.getByRole('combobox', { name: en.variant.label });
    expect(select).toHaveValue('ornamented');

    fireEvent.change(select, { target: { value: 'standard' } });

    expect(query().get('v')).toBe('standard');
    expect(query().get('st')).toBe('2');
    expect(screen.getByRole('combobox', { name: en.variant.label })).toHaveValue('standard');
  });

  it('has no variant selector for a tune with one variant', () => {
    open('#/tune/greensleeves');
    expect(screen.queryByRole('combobox', { name: en.variant.label })).not.toBeInTheDocument();
  });

  it.each(['#/tune/no-such-tune', '#/tune/the-kesh?v=no-such-variant', '#/nowhere'])(
    'shows not found for %s',
    (hash) => {
      open(hash);
      expect(
        screen.getByRole('heading', { level: 1, name: en.notFound.heading }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: en.notFound.back })).toHaveAttribute('href', '#/');
    },
  );

  it('plays in the displayed key at the chosen tempo', async () => {
    open('#/tune/the-kesh?st=-2');
    fireEvent.change(screen.getByRole('combobox', { name: en.player.tempo }), {
      target: { value: '60' },
    });
    const play = await screen.findByRole('button', { name: en.player.play });
    await waitFor(() => expect(play).toBeEnabled());

    await act(async () => {
      fireEvent.click(play);
    });

    expect(fake.adapter.createPlayer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ semitones: -2, tempo: 60 }),
    );
    expect(fake.player.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: en.player.pause })).toBeInTheDocument();
  });

  it('stops playback when the transposition changes', async () => {
    open('#/tune/the-kesh');
    const play = await screen.findByRole('button', { name: en.player.play });
    await waitFor(() => expect(play).toBeEnabled());
    await act(async () => {
      fireEvent.click(play);
    });

    fireEvent.click(upButton());

    expect(fake.player.dispose).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: en.player.play })).toBeInTheDocument();
  });

  it('explains when audio cannot start, and keeps the page working', async () => {
    fake.player.play.mockRejectedValue(new Error('no audio'));
    open('#/tune/the-kesh');
    const play = await screen.findByRole('button', { name: en.player.play });
    await waitFor(() => expect(play).toBeEnabled());

    await act(async () => {
      fireEvent.click(play);
    });

    expect(screen.getByText(en.player.error)).toBeInTheDocument();
    fireEvent.click(upButton());
    expect(keyText()).toHaveTextContent('Key: A♭ major (+1)');
  });
});
