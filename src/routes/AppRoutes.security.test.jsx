import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppRoutes from './AppRoutes';
import { renderWithProviders, screen } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildCatalogStats, buildSession, seedStoredSession, SESSION_STORAGE_KEY as SESSION_KEY } from '../testing/fixtures';

const LANGUAGE_KEY = 'motorcycle-comparator.language';
const LEGACY_TOKEN_KEY = 'motorcycle-comparator.token';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

// SEC-002: Verifies forged session data cannot reach protected admin routes.
describe('SEC-002: forged session data does not reach the admin route UI', () => {
  it('sends a session forged in storage to the login screen, not to the form', async () => {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        username: 'attacker',
        roles: ['ROLE_ADMIN'],
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    );
    window.localStorage.setItem(LEGACY_TOKEN_KEY, 'forged');

    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/new' });

    // First render of the lazy admin chunk in this file, so it has to clear Suspense
    // before anything can be asserted — the 1s default is tight under coverage.
    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'New motorcycle' })).not.toBeInTheDocument();
  });

  it('still opens the form for a genuinely signed-in session, without re-authenticating', async () => {
    // The counterpart assertion: the gate fails closed on forged data without also locking
    // out the admin who actually holds a token from this page load.
    seedStoredSession(buildSession({ roles: ['ROLE_ADMIN'] }));

    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/new' });

    expect(
      await screen.findByRole('heading', { name: 'New motorcycle' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(mockApi.history.post.filter((request) => request.url === '/auth/login')).toHaveLength(0);
  });
});

// SEC-003: Verifies forged session data cannot reach protected /admin/stats.
describe('SEC-003: forged session data does not reach the /admin/stats route UI', () => {
  it('sends a session forged in storage to the login screen, not to the stats page', async () => {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        username: 'attacker',
        roles: ['ROLE_ADMIN'],
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    );
    window.localStorage.setItem(LEGACY_TOKEN_KEY, 'forged');

    renderWithProviders(<AppRoutes />, { route: '/admin/stats' });

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Catalogue insights' })).not.toBeInTheDocument();
  });

  it('still opens the stats page for a genuinely signed-in session, without re-authenticating', async () => {
    seedStoredSession(buildSession({ roles: ['ROLE_ADMIN'] }));
    mockApi.onGet('/admin/stats').reply(200, buildCatalogStats());

    renderWithProviders(<AppRoutes />, { route: '/admin/stats' });

    expect(
      await screen.findByRole('heading', { name: 'Catalogue insights' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(mockApi.history.post.filter((request) => request.url === '/auth/login')).toHaveLength(0);
  });
});
