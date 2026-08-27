import { afterEach, describe, expect, it } from 'vitest';
import { api, resolveImageUrl } from './api';
import { mockApi } from '../testing/mockApi';

/**
 * Regression tests locking in behaviour that this audit verified is already safe.
 * See docs/security-audit.md for the full write-up of each category.
 */

afterEach(() => {
  mockApi.reset();
});

describe('SEC: ApiRequestError never leaks the raw transport objects', () => {
  it('carries only the normalised fields, never the axios response/request/config', async () => {
    mockApi.onGet('/probe').reply(500, {
      message: 'boom',
      internalTrace: 'some-server-internal-stack-trace-that-must-not-reach-the-ui',
    });

    const error = await api.get('/probe').catch((e) => e);

    expect(error.response).toBeUndefined();
    expect(error.request).toBeUndefined();
    expect(error.config).toBeUndefined();
    // Only these four fields are ever attached — see ApiRequestError in services/api.js.
    expect(Object.keys(error).sort()).toEqual(['name', 'path', 'status', 'violations'].sort());
  });
});

describe('SEC: resolveImageUrl neutralises non-http(s) schemes', () => {
  it('never returns an executable javascript: URI', () => {
    const result = resolveImageUrl('javascript:alert(document.cookie)');
    expect(result).not.toMatch(/^javascript:/i);
  });

  it('never returns an executable vbscript: URI', () => {
    const result = resolveImageUrl('vbscript:msgbox(1)');
    expect(result).not.toMatch(/^vbscript:/i);
  });
});

describe('SEC: the shared axios instance pins no default Content-Type', () => {
  it('lets axios derive Content-Type per request body instead of a fixed default', () => {
    // A hardcoded default here would strip the multipart boundary FormData needs on
    // image uploads — see the comment above `axios.create(...)` in services/api.js.
    expect(api.defaults.headers.common?.['Content-Type']).toBeUndefined();
    expect(api.defaults.headers.post?.['Content-Type']).toBeUndefined();
  });
});
