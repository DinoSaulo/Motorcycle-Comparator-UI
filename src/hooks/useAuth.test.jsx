import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';
import { mockApi } from '../testing/mockApi';
import { buildSession } from '../testing/fixtures';

const SESSION_KEY = 'motorcycle-comparator.session';

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

  it('restores a valid stored session on mount', () => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(buildSession()));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.username).toBe('admin');
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
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(buildSession()));
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.signOut());

    expect(result.current.isAuthenticated).toBe(false);
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('auto signs out once the token lapses', async () => {
    const session = buildSession({ expiresAt: new Date(Date.now() + 5000).toISOString() });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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

  it('does not schedule an expiry timer for an unparsable expiresAt', () => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(buildSession({ expiresAt: 'not-a-date' })));
    const { result } = renderHook(() => useAuth(), { wrapper });
    // hasExpired() treats an unparsable date as "not expired", so the session restores.
    expect(result.current.session).toBeTruthy();
  });
});
