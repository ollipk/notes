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

/** The displayed key in the bottom bar, e.g. "F♯ dorian" and "+2 semitones". */
const keyText = () => screen.getByRole('status', { name: en.transpose.label });
const bar = () => screen.getByRole('group', { name: en.tune.controls });
const openMore = () => fireEvent.click(screen.getByRole('button', { name: en.tune.more }));
const sheet = () => screen.getByRole('dialog', { name: en.tune.more });
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

  it('goes back to the search results the tune was opened from', async () => {
    open('#/?q=kesh');
    fireEvent.click(screen.getByRole('link', { name: /The Kesh/ }));
    await screen.findByRole('heading', { level: 1, name: 'The Kesh' });
    fireEvent.click(upButton());

    fireEvent.click(screen.getByRole('link', { name: en.tune.back }));

    await waitFor(() => expect(window.location.hash).toBe('#/?q=kesh'));
    expect(screen.getByRole('searchbox')).toHaveValue('kesh');
  });

  it('goes to the home page from a shared link', async () => {
    open('#/tune/the-kesh?st=2');

    fireEvent.click(screen.getByRole('link', { name: en.tune.back }));

    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('shows the score first, then the details, with the controls in the bottom bar', () => {
    open('#/tune/the-kesh');

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1 })).toHaveTextContent('The Kesh');
    const score = screen.getByRole('img', { name: 'Sheet music: The Kesh' });
    const details = screen.getByRole('region', { name: en.tune.details });
    expect(header.compareDocumentPosition(score)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(score.compareDocumentPosition(details)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText('Also known as The Kesh Jig')).toBeInTheDocument();

    expect(within(bar()).getByRole('button', { name: en.transpose.down })).toBeInTheDocument();
    expect(within(bar()).getByRole('button', { name: en.transpose.up })).toBeInTheDocument();
    expect(within(bar()).getByRole('button', { name: en.player.play })).toBeInTheDocument();
    expect(within(bar()).getByRole('button', { name: en.tune.more })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the More sheet with the less frequent controls, and closes it', () => {
    open('#/tune/the-kesh');

    openMore();

    const more = sheet();
    expect(more).toHaveFocus();
    for (const name of [en.variant.label, en.transpose.label, en.player.tempo]) {
      expect(within(more).getByRole('combobox', { name })).toBeInTheDocument();
    }
    for (const name of [en.zoom.in, en.zoom.out, en.player.restart]) {
      expect(within(more).getByRole('button', { name })).toBeInTheDocument();
    }

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.tune.more })).toHaveFocus();
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
    expect(keyText()).toHaveTextContent('F♯ dorian+2 semitones');
  });

  it('renders the score without the fields the page already shows', async () => {
    open('#/tune/drowsy-maggie');

    await waitFor(() => expect(fake.adapter.renderScore).toHaveBeenCalled());
    const abc = String(fake.adapter.renderScore.mock.calls[0]?.[1]);
    expect(abc).not.toMatch(/^[TCROSZN]:/m);
    expect(abc).toMatch(/^K:D$/m); // E dorian, written with its relative major's signature
    expect(keyText()).toHaveTextContent('E dorianWritten key');
  });

  it('steps the transposition with the + button, up to 12', async () => {
    open('#/tune/the-kesh');
    expect(keyText()).toHaveTextContent('G majorWritten key');

    fireEvent.click(upButton());

    expect(query().get('st')).toBe('1');
    expect(query().get('v')).toBe('ornamented');
    expect(keyText()).toHaveTextContent('A♭ major+1 semitone');
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
    expect(keyText()).toHaveTextContent('G major+12 semitones');
  });

  it('disables − at −12', () => {
    open('#/tune/the-kesh?st=-12');
    expect(screen.getByRole('button', { name: en.transpose.down })).toBeDisabled();
  });

  it('sets the nearest transposition when a key is picked', () => {
    open('#/tune/the-kesh');
    openMore();
    const select = screen.getByRole('combobox', { name: en.transpose.label });
    expect(within(select).getAllByRole('option')).toHaveLength(12);
    expect(select).toHaveDisplayValue('G major');

    fireEvent.change(select, { target: { value: '2' } }); // D major
    expect(query().get('st')).toBe('-5');
    expect(keyText()).toHaveTextContent('D major-5 semitones');

    fireEvent.change(select, { target: { value: '1' } }); // D♭ major
    expect(query().get('st')).toBe('6');
    expect(screen.getByRole('combobox', { name: en.transpose.label })).toHaveDisplayValue(
      'D♭ major',
    );
  });

  it('shows the reset button only when transposed', () => {
    open('#/tune/the-kesh?st=3');
    openMore();

    fireEvent.click(screen.getByRole('button', { name: en.transpose.reset }));

    expect(query().has('st')).toBe(false);
    expect(keyText()).toHaveTextContent('G majorWritten key');
    expect(screen.queryByRole('button', { name: en.transpose.reset })).not.toBeInTheDocument();
  });

  it.each(['abc', '13', '-40', '1.5'])('ignores an invalid st=%s', (st) => {
    open(`#/tune/the-kesh?st=${st}`);
    expect(keyText()).toHaveTextContent(/^G majorWritten key$/);
  });

  it('shows the variant selector only for tunes with several variants', () => {
    open('#/tune/the-kesh?st=2');
    openMore();
    const select = screen.getByRole('combobox', { name: en.variant.label });
    expect(select).toHaveValue('ornamented');

    fireEvent.change(select, { target: { value: 'standard' } });

    expect(query().get('v')).toBe('standard');
    expect(query().get('st')).toBe('2');
    expect(screen.getByRole('combobox', { name: en.variant.label })).toHaveValue('standard');
  });

  it('has no variant selector for a tune with one variant', () => {
    open('#/tune/greensleeves');
    openMore();
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
    openMore();
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
    expect(keyText()).toHaveTextContent('A♭ major+1 semitone');
  });
});

describe('focus mode', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('en'));
    fake.adapter.renderScore.mockReturnValue({} as Score);
  });

  const enterFocusMode = () => {
    openMore();
    fireEvent.click(within(sheet()).getByRole('button', { name: en.focus.enter }));
  };
  const chromeShown = () => ({
    header: screen.queryByRole('banner') !== null,
    bar: screen.queryByRole('group', { name: en.tune.controls }) !== null,
    details: screen.queryByRole('region', { name: en.tune.details }) !== null,
  });
  const allShown = { header: true, bar: true, details: true };
  const noneShown = { header: false, bar: false, details: false };

  it('shows only the score, and the exit button brings the page back (CSS fallback)', () => {
    // jsdom has no Fullscreen API, like iPhone Safari.
    expect(document.fullscreenEnabled).toBeFalsy();
    open('#/tune/the-kesh');

    enterFocusMode();

    expect(chromeShown()).toEqual(noneShown);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sheet music: The Kesh' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: en.focus.exit }));

    expect(chromeShown()).toEqual(allShown);
    expect(screen.queryByRole('button', { name: en.focus.exit })).not.toBeInTheDocument();
  });

  it('leaves the CSS focus mode with Escape', () => {
    open('#/tune/the-kesh');
    enterFocusMode();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(chromeShown()).toEqual(allShown);
  });

  describe('with the Fullscreen API', () => {
    let fullscreenElement: Element | null = null;
    const setFullscreen = (element: Element | null) => {
      fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    const requestFullscreen = vi.fn(function (this: Element) {
      setFullscreen(this);
      return Promise.resolve();
    });
    const exitFullscreen = vi.fn(() => {
      setFullscreen(null);
      return Promise.resolve();
    });

    beforeEach(() => {
      fullscreenElement = null;
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenElement,
      });
      Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: exitFullscreen,
      });
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        configurable: true,
        value: requestFullscreen,
      });
      return () => {
        for (const name of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen']) {
          Reflect.deleteProperty(document, name);
        }
        Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
      };
    });

    it('enters browser full screen and leaves it with the exit button', () => {
      open('#/tune/the-kesh');

      enterFocusMode();

      expect(requestFullscreen).toHaveBeenCalled();
      expect(chromeShown()).toEqual(noneShown);

      fireEvent.click(screen.getByRole('button', { name: en.focus.exit }));

      expect(exitFullscreen).toHaveBeenCalled();
      expect(chromeShown()).toEqual(allShown);
    });

    it('follows the browser when full screen is left by a system gesture', () => {
      open('#/tune/the-kesh');
      enterFocusMode();

      act(() => setFullscreen(null));

      expect(chromeShown()).toEqual(allShown);
    });
  });
});
