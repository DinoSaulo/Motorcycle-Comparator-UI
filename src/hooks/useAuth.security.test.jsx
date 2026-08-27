import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';
import { mockApi } from '../testing/mockApi';
import { buildSession, seedStoredSession, SESSION_STORAGE_KEY as SESSION_KEY } from '../testing/fixtures';

const LEGACY_TOKEN_KEY = 'motorcycle-comparator.token';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

afterEach(() => {
  mockApi.reset();
});

/**
 * SEC-002 (see docs/security-audit.md) — hardened; residual risk accepted and documented.
 *
 * `AuthProvider` still cannot verify anything cryptographically: a pure SPA has no way to
 * validate a JWT signature, and every privileged *write* is authorised by the API, which is
 * outside this frontend's control. What changed is the cheapest attack. Editing Web Storage
 * by hand used to be enough to open the admin UI; now the gate also requires a bearer token
 * that only `login()` can put in memory (SEC-001) and an expiry it can actually parse
 * (SEC-002), so a forged storage entry fails closed instead of open.
 */
describe('SEC-002: the admin gate fails closed on client-stored data', () => {
  it('refuses a session forged in sessionStorage, because no token backs it', () => {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        username: 'attacker',
        roles: ['ROLE_ADMIN'],
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    // ...and the unusable metadata is dropped rather than left to be retried.
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(mockApi.history.post).toHaveLength(0);
  });

  it('refuses the pre-fix localStorage pair the old build would have accepted', () => {
    const session = buildSession({ accessToken: 'not-a-real-jwt', roles: ['ROLE_ADMIN'] });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(LEGACY_TOKEN_KEY, session.accessToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('refuses a forged session with no expiry, which used to mean "never expires"', () => {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: 'attacker', roles: ['ROLE_ADMIN'] }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('documents the residual risk: with a token in memory, roles are still taken on trust', () => {
    // This is the part no client-side change can close, and it is why the API — not this
    // hook — remains the authorization boundary. It takes script execution (or a debugger)
    // to reach this state, not a storage edit.
    seedStoredSession(buildSession({ roles: ['ROLE_ADMIN'] }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
    expect(mockApi.history.post).toHaveLength(0);
  });
});
