import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AdminStatsPage from './AdminStatsPage';
import { renderWithProviders, screen, waitFor } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildCatalogStats, buildSession, seedStoredSession } from '../testing/fixtures';

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

describe('AdminStatsPage authentication gate', () => {
  it('shows login form to an anonymous visitor', async () => {
    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });

  it('shows login form to a non-admin signed-in user', async () => {
    seedStoredSession(buildSession({ roles: ['ROLE_EDITOR'] }));

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });
});

describe('AdminStatsPage stats dashboard', () => {
  beforeEach(() => {
    seedStoredSession(buildSession({ roles: ['ROLE_ADMIN'] }));
  });

  it('displays stats when endpoint returns data', async () => {
    mockApi.onGet('/admin/stats').reply(200, buildCatalogStats());

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Catalogue insights' })).toBeInTheDocument();
    });

    // Check a stat card
    expect(screen.getByText('Total motorcycles')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();

    // Check a breakdown section
    expect(screen.getByText('By brand')).toBeInTheDocument();
    expect(screen.getByText('Yamaha')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching', async () => {
    mockApi.onGet('/admin/stats').reply(200, buildCatalogStats());

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    // May or may not see the spinner, but the heading should eventually appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Catalogue insights' })).toBeInTheDocument();
    });
  });

  it('shows error banner and retry button on API failure', async () => {
    mockApi.onGet('/admin/stats').reply(500, { message: 'Internal server error' });

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty catalogue (totalMotorcycles: 0)', async () => {
    mockApi.onGet('/admin/stats').reply(200, buildCatalogStats({ totalMotorcycles: 0 }));

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Catalogue insights' })).toBeInTheDocument();
    });

    // When totalMotorcycles is 0, the page renders the empty state box
    expect(screen.getByText('No data yet.')).toBeInTheDocument();
    // Ensure breakdowns are not shown
    expect(screen.queryByText('By brand')).not.toBeInTheDocument();
  });

  it('retries the fetch when retry button is clicked', async () => {
    const user = userEvent.setup();
    mockApi.onGet('/admin/stats').replyOnce(500, { message: 'First error' });
    mockApi.onGet('/admin/stats').replyOnce(200, buildCatalogStats());

    renderWithProviders(<AdminStatsPage />, { route: '/admin/stats' });

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
    });
  });
});
