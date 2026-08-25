import { api, setStoredToken } from './api';

export const ADMIN_ROLE = 'ROLE_ADMIN';
const SESSION_KEY = 'motorcycle-comparator.session';

/**
 * `POST /auth/login` — returns `{ accessToken, tokenType, expiresAt, username, roles }`.
 *
 * The token is stored here rather than by the caller so every path that obtains one also
 * arms the axios interceptor, and a component can never hold a token the client does not send.
 */
export async function login({ username, password }) {
  const { data } = await api.post('/auth/login', { username, password });
  setStoredToken(data.accessToken);
  saveSession(data);
  return data;
}

export function logout() {
  setStoredToken(null);
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage may be unavailable; the in-memory state is cleared regardless */
  }
}

export function isAdmin(session) {
  return Boolean(session?.roles?.includes(ADMIN_ROLE));
}

/**
 * The stored session, or `null` when there is none or it has expired.
 *
 * Expiry is checked client-side purely to avoid rendering an admin screen that every request
 * would then bounce — the server remains the only authority, and the JWT cannot be revoked
 * before it lapses anyway.
 */
export function restoreSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.accessToken || hasExpired(session.expiresAt)) {
      logout();
      return null;
    }
    return session;
  } catch {
    // Corrupt or unreadable storage should log the user out, never crash the app.
    logout();
    return null;
  }
}

export function hasExpired(expiresAt) {
  if (!expiresAt) return false;
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) ? false : expiry <= Date.now();
}

function saveSession(session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* a non-persisted session still works until the tab is closed */
  }
}
