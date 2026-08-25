import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasExpired, isAdmin, login as requestLogin, logout, restoreSession } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Holds the administrator session for the app.
 *
 * The session is restored from storage on mount so a reload does not drop the admin back to
 * the login screen, and a timer signs them out the moment the token lapses rather than
 * letting them fill in a long form that the API would reject on submit.
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
    if (!session?.expiresAt) return undefined;

    const msRemaining = Date.parse(session.expiresAt) - Date.now();
    if (Number.isNaN(msRemaining)) return undefined;
    if (msRemaining <= 0) {
      signOut();
      return undefined;
    }

    // setTimeout saturates above ~24.8 days; the token's 2h TTL is nowhere near that,
    // but clamping keeps a misconfigured TTL from firing the timer immediately.
    const timer = window.setTimeout(signOut, Math.min(msRemaining, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [session?.expiresAt, signOut]);

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
