import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasExpired, isAdmin, login as requestLogin, logout, restoreSession } from '../services/authService';

const AuthContext = createContext(null);

// Holds administrator session state and automatically handles token expiration timers.
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

    // Immediately signs out if token expiration check fails or has elapsed.
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
