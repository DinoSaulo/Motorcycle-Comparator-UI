import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppRoutes from './AppRoutes';
import { renderWithProviders, screen } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildSession, seedStoredSession, SESSION_STORAGE_KEY as SESSION_KEY } from '../testing/fixtures';

const LANGUAGE_KEY = 'motorcycle-comparator.language';
const LEGACY_TOKEN_KEY = 'motorcycle-comparator.token';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

/**
 * Route-level companion to `src/hooks/useAuth.security.test.jsx` — see SEC-002 in
 * docs/security-audit.md. `AppRoutes.test.jsx` already covers the healthy paths; this file
 * pins the hostile ones: what a hand-edited storage entry reaches, and what it does not.
 */
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
