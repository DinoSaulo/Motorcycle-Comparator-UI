import { api, getStoredToken, setStoredToken } from './api';

export const ADMIN_ROLE = 'ROLE_ADMIN';
const SESSION_KEY = 'motorcycle-comparator.session';

// Legacy storage keys cleared on session reset to clean up pre-SEC-001 stored tokens.
const LEGACY_LOCAL_STORAGE_KEYS = ['motorcycle-comparator.token', SESSION_KEY];

// Performs login, stores bearer token in memory, and persists non-sensitive session info.
export async function login({ username, password }) {
  const { data } = await api.post('/auth/login', { username, password });
  setStoredToken(data.accessToken);
  saveSession(data);
  return data;
}

export function logout() {
  setStoredToken(null);
  clearStoredSession();
}

export function isAdmin(session) {
  return Boolean(session?.roles?.includes(ADMIN_ROLE));
}

// Restores non-sensitive session metadata from sessionStorage when memory token is active.
export function restoreSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const session = raw === null ? null : parseStoredSession(raw);

    if (!session || !getStoredToken() || hasExpired(session.expiresAt)) {
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

// SEC-002: Fails closed when expiresAt is missing, unparseable, or past current time.
export function hasExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= Date.now();
}

// Parses and validates stored session JSON, returning null if invalid or tampered.
function parseStoredSession(raw) {
  const parsed = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const { username, roles, expiresAt } = parsed;
  if (typeof username !== 'string' || !Array.isArray(roles)) return null;
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null;

  return { username, roles, expiresAt };
}

// Persists non-sensitive UI session metadata (username, roles, expiresAt) in sessionStorage.
function saveSession({ username, roles, expiresAt }) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, roles, expiresAt }));
  } catch {
    /* a non-persisted session still works until the tab is closed */
  }
}

function clearStoredSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* storage may be unavailable; the in-memory token is dropped regardless */
  }
}
