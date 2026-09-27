import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../locales/en.json';
import fi from '../locales/fi.json';
import { App } from './App';
import { catalog } from './catalog';
import i18n, { LANGUAGE_STORAGE_KEY } from './i18n';

// The tune page loads abcjs lazily; jsdom cannot render it.
vi.mock('../ui/abc/loadAbc', () => ({ loadAbc: () => new Promise(() => {}) }));

const searchField = () => screen.getByRole('searchbox', { name: en.search.label });
const titles = () =>
  within(screen.getByRole('region', { name: en.catalog.heading }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('a > span')?.textContent);
const query = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('q');

describe('App', () => {
  beforeEach(async () => {
    window.location.hash = '#/';
    await act(() => i18n.changeLanguage('en'));
  });

  it('shows the app name and lists the tune catalog', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: en.app.name })).toBeInTheDocument();
    expect(document.title).toBe(en.app.name);

    const list = within(screen.getByRole('region', { name: en.catalog.heading })).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    const rowTitle = (item: HTMLElement) => item.querySelector('a > span')?.textContent;
    const row = (title: string) => items.find((item) => rowTitle(item) === title) as HTMLElement;
    // Every tune in tunes/, in catalog order. Adding a tune must not break this test.
    expect(items.length).toBeGreaterThan(0);
    expect(items.map(rowTitle)).toEqual(catalog.map((tune) => tune.variants[0].titles[0]));
    expect(within(row('The Kesh')).getByRole('link')).toHaveAttribute('href', '#/tune/the-kesh');
    expect(row('The Kesh')).toHaveTextContent('Jig · Ireland · 2 variants');
    expect(row('Hårgalåten')).toHaveTextContent('Polska · Sweden · 1 variant');
  });

  it('switches the text when another language is selected', async () => {
    render(<App />);

    const select = screen.getByRole('combobox', { name: en.language.label });
    await act(async () => {
      fireEvent.change(select, { target: { value: 'fi' } });
    });

    expect(await screen.findByRole('heading', { name: fi.catalog.heading })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.catalog.heading })).not.toBeInTheDocument();
    expect(screen.getByText('Jigi · Irlanti · 2 versiota')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: fi.language.label })).toHaveValue('fi');
    expect(document.documentElement.lang).toBe('fi');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fi');
  });
});

describe('search', () => {
  beforeEach(async () => {
    window.location.hash = '#/';
    await act(() => i18n.changeLanguage('en'));
  });

  it('focuses the search field when the home page opens', () => {
    render(<App />);

    expect(searchField()).toHaveFocus();
    expect(searchField()).toHaveAttribute('type', 'search');
  });

  it('filters the list as the player types and keeps the query in the URL', () => {
    render(<App />);

    fireEvent.change(searchField(), { target: { value: 'hargala' } });

    expect(titles()).toEqual(['Hårgalåten']);
    expect(query()).toBe('hargala');

    fireEvent.click(screen.getByRole('button', { name: en.search.clear }));

    expect(titles()).toHaveLength(catalog.length);
    expect(query()).toBeNull();
    expect(searchField()).toHaveFocus();
  });

  it('reads the query from the URL', () => {
    window.location.hash = '#/?q=kesh%20jig';
    render(<App />);

    expect(searchField()).toHaveValue('kesh jig');
    expect(titles()).toEqual(['The Kesh']);
  });

  it('says so when nothing matches', () => {
    window.location.hash = '#/?q=zzz';
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('No tunes match “zzz”.');
  });

  it('opens the first result on Enter, and back restores the results', async () => {
    render(<App />);

    fireEvent.change(searchField(), { target: { value: 'maggie' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Drowsy Maggie' }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/tune/drowsy-maggie');

    act(() => window.history.back());

    await waitFor(() => expect(searchField()).toHaveValue('maggie'));
    expect(titles()).toEqual(['Drowsy Maggie']);
  });
});
