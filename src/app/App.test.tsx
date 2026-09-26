import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import en from '../locales/en.json';
import fi from '../locales/fi.json';
import { App } from './App';
import i18n, { LANGUAGE_STORAGE_KEY } from './i18n';

describe('App', () => {
  beforeEach(async () => {
    await act(() => i18n.changeLanguage('en'));
  });

  it('shows the app name and the coming soon text', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: en.app.name })).toBeInTheDocument();
    expect(screen.getByText(en.home.comingSoon)).toBeInTheDocument();
    expect(document.title).toBe(en.app.name);
  });

  it('switches the text when another language is selected', async () => {
    render(<App />);

    const select = screen.getByRole('combobox', { name: en.language.label });
    await act(async () => {
      fireEvent.change(select, { target: { value: 'fi' } });
    });

    expect(await screen.findByText(fi.home.comingSoon)).toBeInTheDocument();
    expect(screen.queryByText(en.home.comingSoon)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: fi.language.label })).toHaveValue('fi');
    expect(document.documentElement.lang).toBe('fi');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fi');
  });
});
