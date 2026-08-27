import { api, getStoredToken, setStoredToken } from './api';

export const ADMIN_ROLE = 'ROLE_ADMIN';
const SESSION_KEY = 'motorcycle-comparator.session';

/**
 * Keys written by the versions of this app that persisted the token — and the whole
 * session payload with it — in `localStorage`. They outlive the upgrade, so every path
 * that clears a session clears them too; otherwise a returning admin keeps carrying the
 * exact exposure SEC-001 removed.
 */
const LEGACY_LOCAL_STORAGE_KEYS = ['motorcycle-comparator.token', SESSION_KEY];

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
  clearStoredSession();
}

export function isAdmin(session) {
  return Boolean(session?.roles?.includes(ADMIN_ROLE));
}

/**
 * The stored session, or `null` when there is none, it is malformed, or it has expired.
 *
 * **A reload signs the administrator out, deliberately.** The token now lives in memory
 * only (see `api.js`), so it cannot survive the page the way this metadata does — and
 * metadata without a token would render an authenticated shell that could not back a
 * single request. Trading "session survives F5" for "an XSS payload has nothing to steal
 * from storage" is the accepted cost of SEC-001, not an oversight.
 *
 * Expiry is still checked client-side purely to avoid rendering an admin screen that every
 * request would then bounce — the server remains the only authority, and the JWT cannot be
 * revoked before it lapses anyway.
 */
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

/**
 * A session that cannot say when it lapses is treated as already lapsed.
 *
 * Reading a missing or unparsable `expiresAt` as "never expires" is what let a hand-written
 * storage entry hold the admin gate open indefinitely (SEC-002); the gate has to fail closed
 * on the input it cannot evaluate.
 */
export function hasExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= Date.now();
}

/**
 * Rebuilds the session from stored JSON, or `null` if it is not exactly the record
 * `saveSession` writes.
 *
 * This value is user-writable — it is only `sessionStorage` — and it decides what the admin
 * UI renders, so a partial match is treated as tampering rather than as a session missing a
 * field. Rebuilding from the three known keys also drops anything smuggled in alongside them.
 */
function parseStoredSession(raw) {
  const parsed = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const { username, roles, expiresAt } = parsed;
  if (typeof username !== 'string' || !Array.isArray(roles)) return null;
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null;

  return { username, roles, expiresAt };
}

/**
 * Persists only what the UI needs to draw itself — never `accessToken`, and never anything
 * the server would trust coming back from the client. `sessionStorage` rather than
 * `localStorage` because this metadata is worthless past the tab that created it.
 */
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
