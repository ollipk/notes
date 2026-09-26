import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import en from '../locales/en.json';
import fi from '../locales/fi.json';
import { App } from './App';
import i18n, { LANGUAGE_STORAGE_KEY } from './i18n';

describe('App', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('en'));
  });

  it('shows the app name and lists the tune catalog', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: en.app.name })).toBeInTheDocument();
    expect(document.title).toBe(en.app.name);

    const list = within(screen.getByRole('region', { name: en.catalog.heading })).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('a > span')?.textContent)).toEqual([
      'Drowsy Maggie',
      'Greensleeves',
      'Hårgalåten',
      'The Kesh',
    ]);
    expect(within(items[3] as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '#/tune/the-kesh',
    );
    expect(items[3]).toHaveTextContent('Jig · IE · 2 variants');
    expect(items[2]).toHaveTextContent('Polska · SE · 1 variant');
  });

  it('switches the text when another language is selected', async () => {
    render(<App />);

    const select = screen.getByRole('combobox', { name: en.language.label });
    await act(async () => {
      fireEvent.change(select, { target: { value: 'fi' } });
    });

    expect(await screen.findByRole('heading', { name: fi.catalog.heading })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.catalog.heading })).not.toBeInTheDocument();
    expect(screen.getByText('Jigi · IE · 2 versiota')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: fi.language.label })).toHaveValue('fi');
    expect(document.documentElement.lang).toBe('fi');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fi');
  });
});
