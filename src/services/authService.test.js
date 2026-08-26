import { afterEach, describe, expect, it } from 'vitest';
import {
  ADMIN_ROLE,
  hasExpired,
  isAdmin,
  login,
  logout,
  restoreSession,
} from './authService';
import { getStoredToken } from './api';
import { mockApi } from '../testing/mockApi';
import { buildSession } from '../testing/fixtures';

const SESSION_KEY = 'motorcycle-comparator.session';

afterEach(() => {
  mockApi.reset();
  window.localStorage.clear();
});

describe('login', () => {
  it('stores the token and session on success', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);

    const result = await login({ username: 'admin', password: 'secret' });

    expect(result).toEqual(session);
    expect(getStoredToken()).toBe(session.accessToken);
    expect(JSON.parse(window.localStorage.getItem(SESSION_KEY))).toEqual(session);
  });

  it('rejects with the normalised ApiRequestError on invalid credentials', async () => {
    mockApi.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });
    await expect(login({ username: 'admin', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
    });
    expect(getStoredToken()).toBeNull();
  });
});

describe('logout', () => {
  it('clears both the token and the stored session', () => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(buildSession()));
    logout();
    expect(getStoredToken()).toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('does not throw when storage access fails', () => {
    expect(() => logout()).not.toThrow();
  });
});

describe('isAdmin', () => {
  it('is true when roles include ROLE_ADMIN', () => {
    expect(isAdmin(buildSession({ roles: [ADMIN_ROLE] }))).toBe(true);
  });

  it('is false when roles do not include ROLE_ADMIN', () => {
    expect(isAdmin(buildSession({ roles: ['ROLE_USER'] }))).toBe(false);
  });

  it('is false for a null session', () => {
    expect(isAdmin(null)).toBe(false);
  });

  it('is false when roles is missing entirely', () => {
    expect(isAdmin({})).toBe(false);
  });
});

describe('hasExpired', () => {
  it('is false when there is no expiry', () => {
    expect(hasExpired(undefined)).toBe(false);
  });

  it('is false for a future timestamp', () => {
    expect(hasExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('is true for a past timestamp', () => {
    expect(hasExpired(new Date(Date.now() - 60_000).toISOString())).toBe(true);
  });

  it('is false for an unparsable timestamp', () => {
    expect(hasExpired('not-a-date')).toBe(false);
  });
});

describe('restoreSession', () => {
  it('returns null when nothing is stored', () => {
    expect(restoreSession()).toBeNull();
  });

  it('returns the stored session when valid and unexpired', () => {
    const session = buildSession();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    expect(restoreSession()).toEqual(session);
  });

  it('logs out and returns null when the session has expired', () => {
    const session = buildSession({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    expect(restoreSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('logs out and returns null when the stored session has no accessToken', () => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'admin' }));
    expect(restoreSession()).toBeNull();
  });

  it('logs out and returns null when the stored value is corrupt JSON', () => {
    window.localStorage.setItem(SESSION_KEY, '{not json');
    expect(restoreSession()).toBeNull();
  });
});
