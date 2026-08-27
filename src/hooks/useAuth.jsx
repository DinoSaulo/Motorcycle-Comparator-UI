import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasExpired, isAdmin, login as requestLogin, logout, restoreSession } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Holds the administrator session for the app.
 *
 * `restoreSession()` runs on mount, but since the token is memory-only it can only ever
 * return a session inside the same page load — a reload signs the admin out by design
 * (see `authService.restoreSession`). A timer signs them out the moment the token lapses
 * rather than letting them fill in a long form that the API would reject on submit.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(restoreSession);

  const signOut = useCallback(() => {
    logout();
    setSession(null);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const next = await requestLogin(credentials);
    setSession(next);
    return next;
  }, []);

  useEffect(() => {
    if (!session) return undefined;

    // `hasExpired` also covers a missing or unparsable `expiresAt`, so a session the UI
    // would never treat as authenticated is actively signed out instead of lingering in
    // state as neither signed in nor signed out.
    if (hasExpired(session.expiresAt)) {
      signOut();
      return undefined;
    }

    // setTimeout saturates above ~24.8 days; the token's 2h TTL is nowhere near that,
    // but clamping keeps a misconfigured TTL from firing the timer immediately.
    const msRemaining = Date.parse(session.expiresAt) - Date.now();
    const timer = window.setTimeout(signOut, Math.min(msRemaining, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  const value = useMemo(
    () => ({
      session,
      signIn,
      signOut,
      isAuthenticated: Boolean(session) && !hasExpired(session.expiresAt),
      isAdmin: isAdmin(session),
      username: session?.username ?? null,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
