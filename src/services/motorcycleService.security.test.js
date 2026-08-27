import { afterEach, describe, expect, it } from 'vitest';
import {
  COMPARISON_MAX,
  COMPARISON_MIN,
  compareMotorcycles,
  getMotorcycleById,
  getMotorcycleBySlug,
} from './motorcycleService';
import { mockApi } from '../testing/mockApi';
import { buildComparison, buildMotorcycle } from '../testing/fixtures';

afterEach(() => {
  mockApi.reset();
});

/**
 * SEC-004 (see docs/security-audit.md) — remediated; this file is the regression guard.
 *
 * The 2-4 id bound used to live only in the `useComparison` hook, so any future caller
 * reaching `compareMotorcycles` directly lost the fast-fail and paid for a round trip the
 * API was always going to refuse with a 400. The guard now sits in the service itself,
 * where the contract it enforces actually belongs.
 */
describe('SEC-004: compareMotorcycles enforces the 2-4 id bound itself', () => {
  it.each([
    ['none', []],
    ['one', [1]],
    ['five', [1, 2, 3, 4, 5]],
    ['six', [1, 2, 3, 4, 5, 6]],
  ])('rejects %s ids without issuing a request', async (_label, ids) => {
    await expect(compareMotorcycles(ids)).rejects.toThrow(
      `compareMotorcycles requires ${COMPARISON_MIN}-${COMPARISON_MAX} ids`,
    );
    expect(mockApi.history.get).toHaveLength(0);
  });

  it('rejects a non-array argument rather than letting join() decide', async () => {
    await expect(compareMotorcycles(undefined)).rejects.toThrow(/requires/);
    await expect(compareMotorcycles('1,2,3')).rejects.toThrow(/requires/);
    expect(mockApi.history.get).toHaveLength(0);
  });

  it.each([
    ['the minimum', [1, 2]],
    ['the maximum', [1, 2, 3, 4]],
  ])('still issues the request at %s', async (_label, ids) => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison());

    await compareMotorcycles(ids);

    expect(mockApi.history.get).toHaveLength(1);
    expect(mockApi.history.get[0].params).toEqual({ ids: ids.join(',') });
  });
});

/**
 * SEC-005 (see docs/security-audit.md) — remediated; regression guard.
 *
 * Ids and slugs come from route params, i.e. straight from the address bar. Interpolated
 * raw, a `/`, `?` or `#` would re-point the request at a different endpoint (or truncate it)
 * instead of producing an honest 404.
 */
describe('SEC-005: path segments are URI-encoded before interpolation', () => {
  it('encodes a slug that tries to traverse to another endpoint', async () => {
    const motorcycle = buildMotorcycle();
    mockApi.onGet('/motorcycles/slug/..%2F..%2Fauth%2Flogin').reply(200, motorcycle);

    await expect(getMotorcycleBySlug('../../auth/login')).resolves.toEqual(motorcycle);
    expect(mockApi.history.get[0].url).toBe('/motorcycles/slug/..%2F..%2Fauth%2Flogin');
  });

  it('encodes the fragment and query characters that would truncate the path', async () => {
    const motorcycle = buildMotorcycle();
    mockApi.onGet('/motorcycles/slug/mt-07%23%3Ffoo%3Dbar').reply(200, motorcycle);

    await expect(getMotorcycleBySlug('mt-07#?foo=bar')).resolves.toEqual(motorcycle);
    expect(mockApi.history.get[0].url).toBe('/motorcycles/slug/mt-07%23%3Ffoo%3Dbar');
  });

  it('leaves an ordinary numeric id untouched', async () => {
    const motorcycle = buildMotorcycle();
    mockApi.onGet('/motorcycles/1').reply(200, motorcycle);

    await expect(getMotorcycleById(1)).resolves.toEqual(motorcycle);
    expect(mockApi.history.get[0].url).toBe('/motorcycles/1');
  });
});
