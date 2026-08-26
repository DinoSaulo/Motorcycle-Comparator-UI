import { beforeEach, describe, expect, it } from 'vitest';
import NotFoundPage from './NotFoundPage';
import { renderWithProviders, screen } from '../testing/test-utils';

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

describe('NotFoundPage', () => {
  it('states that the page was not found', () => {
    renderWithProviders(<NotFoundPage />, { route: '/nowhere' });

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('offers a way back to the catalogue', () => {
    renderWithProviders(<NotFoundPage />, { route: '/nowhere' });

    expect(screen.getByRole('link', { name: 'Back to catalogue' })).toHaveAttribute('href', '/');
  });

  it('follows the active language', () => {
    window.localStorage.setItem(LANGUAGE_KEY, 'pt');

    renderWithProviders(<NotFoundPage />, { route: '/nowhere' });

    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
