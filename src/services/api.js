import axios from 'axios';
import { DEFAULT_LANGUAGE, getStoredLanguage, translate } from '../i18n';

const DEFAULT_BASE_URL = 'http://localhost:8080/api/v1';

// Helper function for i18n translations outside React component contexts.
function t(key, vars) {
  return translate(getStoredLanguage() ?? DEFAULT_LANGUAGE, key, vars);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout: 15_000,
  // Content-Type is omitted so Axios can calculate JSON or FormData boundaries dynamically.
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

// Converts host-relative API image URLs to fully qualified absolute image src URLs.
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return getApiOrigin() + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
}

// Standardized error wrapper class for all network, HTTP, and validation failures.
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

// SEC-001: Memory-only bearer token storage keeping tokens out of Web Storage to prevent XSS.
let bearerToken = null;

export function getStoredToken() {
  return bearerToken;
}

export function setStoredToken(token) {
  bearerToken = token || null;
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

// Drops empty query parameters to prevent matching literal empty strings against API.
export function pruneParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}
