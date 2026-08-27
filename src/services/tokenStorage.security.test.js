import { afterEach, describe, expect, it } from 'vitest';
import { login, logout } from './authService';
import { getStoredToken } from './api';
import { mockApi } from '../testing/mockApi';
import { buildSession, SESSION_STORAGE_KEY } from '../testing/fixtures';

// SEC-001: Regression security tests ensuring bearer token is never persisted in Web Storage.
const LEGACY_TOKEN_KEY = 'motorcycle-comparator.token';

afterEach(() => {
  mockApi.reset();
  logout();
});

describe('SEC-001: admin token/session storage', () => {
  it('keeps the bearer token out of every Web Storage area after a real login', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);

    await login({ username: 'admin', password: 'secret' });

    // The token is armed for the interceptor...
    expect(getStoredToken()).toBe(session.accessToken);

    // ...but an XSS payload sweeping storage finds nothing to exfiltrate.
    const everythingStored = [window.localStorage, window.sessionStorage].flatMap((storage) =>
      Object.keys(storage).map((key) => storage.getItem(key)),
    );
    expect(everythingStored.join('|')).not.toContain(session.accessToken);
    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('persists only non-sensitive display metadata for the session', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);

    await login({ username: 'admin', password: 'secret' });

    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
    expect(stored).toEqual({
      username: session.username,
      roles: session.roles,
      expiresAt: session.expiresAt,
    });
    expect(stored).not.toHaveProperty('accessToken');
  });

  it('drops the in-memory token on logout, leaving nothing behind to replay', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);
    await login({ username: 'admin', password: 'secret' });

    logout();

    expect(getStoredToken()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears the localStorage entries written before the token moved in-memory', () => {
    // A returning admin still carries the pre-fix keys; leaving them would preserve the
    // exact exposure this finding removed.
    window.localStorage.setItem(LEGACY_TOKEN_KEY, 'jwt.from.the.old.build');
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(buildSession()));

    logout();

    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
