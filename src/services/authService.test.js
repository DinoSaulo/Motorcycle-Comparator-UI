import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_ROLE,
  hasExpired,
  isAdmin,
  login,
  logout,
  restoreSession,
} from './authService';
import { getStoredToken, setStoredToken } from './api';
import { mockApi } from '../testing/mockApi';
import { buildSession, seedStoredSession, SESSION_STORAGE_KEY as SESSION_KEY } from '../testing/fixtures';

afterEach(() => {
  mockApi.reset();
  logout();
});

/** The metadata half of a session, as `saveSession` writes it — no token. */
function storedMetadata(session = buildSession()) {
  const { username, roles, expiresAt } = session;
  return { username, roles, expiresAt };
}

describe('login', () => {
  it('arms the in-memory token and persists only the session metadata', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);

    const result = await login({ username: 'admin', password: 'secret' });

    expect(result).toEqual(session);
    expect(getStoredToken()).toBe(session.accessToken);
    expect(JSON.parse(window.sessionStorage.getItem(SESSION_KEY))).toEqual(storedMetadata(session));
  });

  it('rejects with the normalised ApiRequestError on invalid credentials', async () => {
    mockApi.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });
    await expect(login({ username: 'admin', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
    });
    expect(getStoredToken()).toBeNull();
  });

  it('still signs the admin in when storage refuses the write', async () => {
    // Private browsing and blocked site data both throw on setItem; the token is in memory,
    // so the session works for this page load regardless.
    const spy = vi.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);

    await expect(login({ username: 'admin', password: 'secret' })).resolves.toEqual(session);
    expect(getStoredToken()).toBe(session.accessToken);
    spy.mockRestore();
  });
});

describe('logout', () => {
  it('clears both the token and the stored session', () => {
    seedStoredSession();
    logout();
    expect(getStoredToken()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
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
  // SEC-002: an expiry the gate cannot evaluate counts as lapsed, never as "no deadline".
  it('is true when there is no expiry', () => {
    expect(hasExpired(undefined)).toBe(true);
    expect(hasExpired(null)).toBe(true);
    expect(hasExpired('')).toBe(true);
  });

  it('is true for an unparsable timestamp', () => {
    expect(hasExpired('not-a-date')).toBe(true);
  });

  it('is false for a future timestamp', () => {
    expect(hasExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('is true for a past timestamp', () => {
    expect(hasExpired(new Date(Date.now() - 60_000).toISOString())).toBe(true);
  });
});

describe('restoreSession', () => {
  it('returns null when nothing is stored', () => {
    expect(restoreSession()).toBeNull();
  });

  it('returns the stored metadata while the token is still in memory', () => {
    const session = seedStoredSession();
    expect(restoreSession()).toEqual({
      username: session.username,
      roles: session.roles,
      expiresAt: session.expiresAt,
    });
  });

  it('returns null after a reload, because the token cannot survive one', () => {
    // Asserts SEC-001 trade-off: reloading without in-memory token resets stored session.
    seedStoredSession();
    setStoredToken(null);

    expect(restoreSession()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('logs out and returns null when the session has expired', () => {
    seedStoredSession(buildSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }));
    expect(restoreSession()).toBeNull();
    expect(getStoredToken()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('rejects metadata with no expiry at all', () => {
    setStoredToken('in-memory-token');
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'admin', roles: [ADMIN_ROLE] }));
    expect(restoreSession()).toBeNull();
  });

  it.each([
    ['a bare string', JSON.stringify('admin')],
    ['an array', JSON.stringify([{ username: 'admin', roles: [ADMIN_ROLE] }])],
    ['null', JSON.stringify(null)],
    ['a non-string username', JSON.stringify({ ...storedMetadata(), username: { toString: 'admin' } })],
    ['a non-array roles', JSON.stringify({ ...storedMetadata(), roles: 'ROLE_ADMIN' })],
    ['an unparsable expiresAt', JSON.stringify({ ...storedMetadata(), expiresAt: 'whenever' })],
    ['corrupt JSON', '{not json'],
  ])('rejects %s outright rather than partially trusting it', (_label, raw) => {
    setStoredToken('in-memory-token');
    window.sessionStorage.setItem(SESSION_KEY, raw);

    expect(restoreSession()).toBeNull();
    expect(getStoredToken()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('keeps only the three known keys, dropping anything smuggled in alongside them', () => {
    const metadata = storedMetadata();
    setStoredToken('in-memory-token');
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...metadata, accessToken: 'forged', isSuperAdmin: true }),
    );

    const session = restoreSession();

    expect(session).toEqual(metadata);
    expect(session).not.toHaveProperty('accessToken');
    expect(session).not.toHaveProperty('isSuperAdmin');
  });

  it('logs out and returns null when storage cannot be read at all', () => {
    const spy = vi.spyOn(window.sessionStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setStoredToken('in-memory-token');

    expect(restoreSession()).toBeNull();
    expect(getStoredToken()).toBeNull();
    spy.mockRestore();
  });
});
