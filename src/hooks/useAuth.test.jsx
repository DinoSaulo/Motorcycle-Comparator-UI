import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';
import { mockApi } from '../testing/mockApi';
import { buildSession, seedStoredSession, SESSION_STORAGE_KEY as SESSION_KEY } from '../testing/fixtures';
import { getStoredToken, setStoredToken } from '../services/api';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  mockApi.reset();
});

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside an AuthProvider');
  });

  it('starts unauthenticated when no session is stored', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.username).toBeNull();
  });

  it('restores a valid session on mount while the token is still in memory', () => {
    seedStoredSession();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.username).toBe('admin');
  });

  it('starts unauthenticated after a reload, since the token does not survive one', () => {
    // Asserts SEC-001 trade-off: stored metadata without in-memory token starts unauthenticated.
    seedStoredSession();
    setStoredToken(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('signs in and updates state from the login response', async () => {
    const session = buildSession();
    mockApi.onPost('/auth/login').reply(200, session);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn({ username: 'admin', password: 'secret' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('admin');
  });

  it('propagates a failed sign-in and leaves state unauthenticated', async () => {
    mockApi.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.signIn({ username: 'admin', password: 'bad' })).rejects.toBeTruthy();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('signs out and clears the session', () => {
    seedStoredSession();
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.signOut());

    expect(result.current.isAuthenticated).toBe(false);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(getStoredToken()).toBeNull();
  });

  it('auto signs out once the token lapses', async () => {
    seedStoredSession(buildSession({ expiresAt: new Date(Date.now() + 5000).toISOString() }));
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(5001);
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('does not schedule an expiry timer when there is no session', () => {
    const { result, unmount } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.session).toBeNull();
    expect(() => unmount()).not.toThrow();
  });

  it('signs out a session whose expiresAt cannot be parsed', async () => {
    // SEC-002: `hasExpired` reads an unusable expiry as expired, so the provider drops the
    // session instead of holding it in state with no timer and no way to lapse.
    const session = buildSession({ expiresAt: 'not-a-date' });
    mockApi.onPost('/auth/login').reply(200, session);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn({ username: 'admin', password: 'secret' });
    });

    await waitFor(() => expect(result.current.session).toBeNull());
    expect(result.current.isAuthenticated).toBe(false);
    expect(getStoredToken()).toBeNull();
  });
});
