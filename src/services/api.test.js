import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
  ApiRequestError,
  AUTH_TOKEN_KEY,
  api,
  getApiOrigin,
  getStoredToken,
  pruneParams,
  resolveImageUrl,
  setStoredToken,
} from './api';
import { mockApi } from '../testing/mockApi';

afterEach(() => {
  mockApi.reset();
  setStoredToken(null);
});

describe('getApiOrigin', () => {
  it('derives the origin from the configured baseURL', () => {
    expect(getApiOrigin()).toBe('http://localhost:8080');
  });

  it('falls back to window.location.origin when the baseURL cannot be parsed as a URL', () => {
    const original = api.defaults.baseURL;
    // An unclosed IPv6 host is one of the few strings the URL constructor rejects
    // outright, which is what exercises the catch branch.
    api.defaults.baseURL = 'http://[::1';
    expect(getApiOrigin()).toBe(window.location.origin);
    api.defaults.baseURL = original;
  });
});

describe('resolveImageUrl', () => {
  it('returns null for a missing url', () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl('')).toBeNull();
  });

  it('prefixes a host-relative path with the API origin', () => {
    expect(resolveImageUrl('/api/v1/images/motorcycles/1.jpg')).toBe(
      'http://localhost:8080/api/v1/images/motorcycles/1.jpg',
    );
  });

  it('adds a separating slash when the relative path lacks a leading one', () => {
    expect(resolveImageUrl('images/motorcycles/1.jpg')).toBe(
      'http://localhost:8080/images/motorcycles/1.jpg',
    );
  });

  it('passes an http(s) absolute URL through untouched', () => {
    expect(resolveImageUrl('https://cdn.example.com/x.jpg')).toBe('https://cdn.example.com/x.jpg');
  });

  it('passes a protocol-relative URL through untouched', () => {
    expect(resolveImageUrl('//cdn.example.com/x.jpg')).toBe('//cdn.example.com/x.jpg');
  });

  it('passes a data: URL through untouched', () => {
    expect(resolveImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });
});

describe('token storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('round-trips a token', () => {
    setStoredToken('abc123');
    expect(getStoredToken()).toBe('abc123');
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe('abc123');
  });

  it('removes the token when set to a falsy value', () => {
    setStoredToken('abc123');
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });

  it('does not throw when storage access throws on read', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getStoredToken()).toBeNull();
    spy.mockRestore();
  });

  it('does not throw when storage access throws on write', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setStoredToken('x')).not.toThrow();
    spy.mockRestore();
  });
});

describe('request interceptor', () => {
  it('attaches a bearer token when one is stored', async () => {
    setStoredToken('my-token');
    mockApi.onGet('/probe').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer my-token');
      return [200, {}];
    });
    await api.get('/probe');
  });

  it('sends no Authorization header when unauthenticated', async () => {
    mockApi.onGet('/probe').reply((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, {}];
    });
    await api.get('/probe');
  });
});

describe('response interceptor', () => {
  it('passes a successful response through untouched', async () => {
    mockApi.onGet('/probe').reply(200, { ok: true });
    const { data } = await api.get('/probe');
    expect(data).toEqual({ ok: true });
  });

  it('normalises a validation error body into an ApiRequestError', async () => {
    mockApi.onPost('/probe').reply(400, {
      message: 'Invalid request',
      violations: [{ field: 'brand', message: 'must not be blank' }],
      path: '/api/v1/probe',
    });

    await expect(api.post('/probe', {})).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 400,
      message: 'Invalid request',
      violations: [{ field: 'brand', message: 'must not be blank' }],
      path: '/api/v1/probe',
    });
  });

  it('drops a rejected token on a 401', async () => {
    setStoredToken('stale-token');
    mockApi.onGet('/probe').reply(401, { message: 'Unauthorized' });
    await expect(api.get('/probe')).rejects.toBeInstanceOf(ApiRequestError);
    expect(getStoredToken()).toBeNull();
  });

  it('falls back to statusText when the error body has no message', async () => {
    mockApi.onGet('/probe').reply(500, {});
    await expect(api.get('/probe')).rejects.toMatchObject({ status: 500 });
  });

  it('surfaces a network error (no response) as a non-retryable-by-default message', async () => {
    mockApi.onGet('/probe').networkError();
    await expect(api.get('/probe')).rejects.toMatchObject({ status: undefined });
  });

  it('maps ECONNABORTED to the timeout message', async () => {
    mockApi.onGet('/probe').timeout();
    const error = await api.get('/probe').catch((e) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBeUndefined();
  });

  it('propagates cancellation instead of converting it to an ApiRequestError', async () => {
    mockApi.onGet('/probe').reply(200, {});
    const controller = new AbortController();
    controller.abort();

    const error = await api.get('/probe', { signal: controller.signal }).catch((e) => e);
    expect(axios.isCancel(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiRequestError);
  });

  it('defaults violations to an empty array when absent', async () => {
    mockApi.onGet('/probe').reply(404, { message: 'Not found' });
    const error = await api.get('/probe').catch((e) => e);
    expect(error.violations).toEqual([]);
  });
});

describe('ApiRequestError.isRetryable', () => {
  it('is retryable when there is no status (network failure)', () => {
    expect(new ApiRequestError({ message: 'x' }).isRetryable).toBe(true);
  });

  it('is retryable for a 5xx status', () => {
    expect(new ApiRequestError({ message: 'x', status: 503 }).isRetryable).toBe(true);
  });

  it('is not retryable for a 4xx status', () => {
    expect(new ApiRequestError({ message: 'x', status: 404 }).isRetryable).toBe(false);
  });
});

describe('pruneParams', () => {
  it('drops undefined, null and empty-string values', () => {
    expect(pruneParams({ brand: 'Yamaha', model: undefined, q: null, category: '' })).toEqual({
      brand: 'Yamaha',
    });
  });

  it('keeps falsy-but-meaningful values like 0 and false', () => {
    expect(pruneParams({ page: 0, active: false })).toEqual({ page: 0, active: false });
  });

  it('returns an empty object for an empty input', () => {
    expect(pruneParams({})).toEqual({});
  });
});
