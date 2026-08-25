import axios from 'axios';
import { DEFAULT_LANGUAGE, getStoredLanguage, translate } from '../i18n';

const DEFAULT_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * This module sits outside React, so it has no `useLanguage()` to call — it reads the
 * persisted preference directly instead, which is the same source `LanguageProvider`
 * seeds its own state from.
 */
function t(key, vars) {
  return translate(getStoredLanguage() ?? DEFAULT_LANGUAGE, key, vars);
}

/** Where the bearer token lives between reloads. Writes are admin-only, reads never need it. */
export const AUTH_TOKEN_KEY = 'motorcycle-comparator.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout: 15_000,
  // No default Content-Type on purpose: axios derives `application/json` for a plain
  // object and `multipart/form-data` — with the boundary — for FormData. Pinning it
  // here would produce a boundary-less multipart header that Spring cannot parse.
});

/** Absolute origin of the API, used to resolve the host-relative image URLs it returns. */
export function getApiOrigin() {
  const base = api.defaults.baseURL ?? DEFAULT_BASE_URL;
  try {
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

/**
 * Turns a motorcycle's `imageUrl` into something an `<img src>` can load.
 *
 * Uploaded images come back host-relative (`/api/v1/images/motorcycles/…`) because the API
 * cannot know the origin it is reached on. Resolving them against the *API* origin — not the
 * page's — is what makes them load while the app is served from Vite on a different port.
 * Absolute URLs are curated external links and pass through untouched.
 */
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return getApiOrigin() + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
}

/**
 * The API answers every failure with the same `ApiError` body, so the whole client
 * only ever handles one error shape. `violations` is populated on 400s from bean validation.
 */
export class ApiRequestError extends Error {
  constructor({ message, status, violations = [], path }) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.violations = violations;
    this.path = path;
  }

  /** True when retrying the exact same request could plausibly succeed. */
  get isRetryable() {
    return this.status === undefined || this.status >= 500;
  }
}

export function getStoredToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    // Private browsing and blocked site data both throw here; an anonymous
    // visitor still gets the full read-only catalogue, so this is not fatal.
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    /* see getStoredToken */
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cancellation is a control-flow signal, not a failure: callers abort in
    // cleanup on every keystroke, and those must not surface as error banners.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const { response, config } = error;

    if (!response) {
      return Promise.reject(
        new ApiRequestError({
          message:
            error.code === 'ECONNABORTED'
              ? t('errors.apiTimeout')
              : t('errors.apiUnreachable', { baseUrl: api.defaults.baseURL }),
          path: config?.url,
        }),
      );
    }

    const payload = response.data ?? {};

    if (response.status === 401) {
      // A rejected token is a dead token; drop it so the UI stops pretending to be signed in.
      setStoredToken(null);
    }

    return Promise.reject(
      new ApiRequestError({
        message: payload.message || response.statusText || t('errors.requestFailed'),
        status: response.status,
        violations: payload.violations ?? [],
        path: payload.path ?? config?.url,
      }),
    );
  },
);

/**
 * Drops keys the user has not constrained. An empty string reaching the API would be
 * matched literally against `brand`, quietly returning nothing.
 */
export function pruneParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}
