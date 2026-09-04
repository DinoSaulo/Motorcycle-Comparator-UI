// Test hooks (beforeEach, afterEach, describe, it, expect) are globally available via globals: true in vite.config.js
import { mockApi } from '../testing/mockApi';
import { getCatalogStats } from './adminStatsService';
import { ApiRequestError } from './api';
import { buildCatalogStats } from '../testing/fixtures';

beforeEach(() => {
  window.localStorage.setItem('motorcycle-comparator.language', 'en');
});

afterEach(() => {
  mockApi.reset();
});

describe('getCatalogStats', () => {
  it('fetches GET /admin/stats and returns the response', async () => {
    const mockResponse = {
      totalMotorcycles: 142,
      byBrand: { Yamaha: 12, Honda: 9 },
      byCategory: { NAKED: 30, SPORT: 18 },
      byModelYear: { '2024': 40, '2025': 55 },
      priceEur: { min: 3990, avg: 12430.5, max: 45000, pricedCount: 120 },
      lastUpdatedAt: '2026-09-03T10:15:30Z',
      motorcycleFieldGaps: { priceEur: 22, imageUrl: 60 },
      engineSpecifications: { totalRows: 141, motorcyclesWithoutRow: 1, fieldGaps: { engineType: 0 } },
      dimensions: { totalRows: 134, motorcyclesWithoutRow: 8, fieldGaps: { lengthMm: 10 } },
      additionalSpecs: { totalEntries: 210, motorcyclesWithoutAny: 45 },
    };

    mockApi.onGet('/admin/stats').reply(200, mockResponse);

    const stats = await getCatalogStats({ signal: new AbortController().signal });
    expect(stats).toEqual(mockResponse);
  });

  it('propagates 401 as ApiRequestError', async () => {
    mockApi.onGet('/admin/stats').reply(401, { message: 'Unauthorized' });

    await expect(
      getCatalogStats({ signal: new AbortController().signal }),
    ).rejects.toThrow('Unauthorized');
  });

  // HTTP error responses
  describe('HTTP error responses', () => {
    it('handles 400 Bad Request', async () => {
      mockApi.onGet('/admin/stats').reply(400, { message: 'Invalid request' });

      await expect(getCatalogStats({ signal: new AbortController().signal })).rejects.toThrow(
        'Invalid request',
      );
    });

    it('handles 403 Forbidden', async () => {
      mockApi.onGet('/admin/stats').reply(403, { message: 'Access denied' });

      await expect(getCatalogStats({ signal: new AbortController().signal })).rejects.toThrow(
        'Access denied',
      );
    });

    it('handles 404 Not Found', async () => {
      mockApi.onGet('/admin/stats').reply(404, { message: 'Endpoint not found' });

      await expect(getCatalogStats({ signal: new AbortController().signal })).rejects.toThrow(
        'Endpoint not found',
      );
    });

    it('handles 500 Internal Server Error', async () => {
      mockApi.onGet('/admin/stats').reply(500, { message: 'Internal server error' });

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.isRetryable).toBe(true);
    });

    it('handles 503 Service Unavailable (retryable)', async () => {
      mockApi.onGet('/admin/stats').reply(503, { message: 'Service unavailable' });

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.isRetryable).toBe(true);
    });

    it('handles 502 Bad Gateway (retryable)', async () => {
      mockApi.onGet('/admin/stats').reply(502, { message: 'Bad gateway' });

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error.isRetryable).toBe(true);
    });

    it('includes error details in ApiRequestError', async () => {
      const violations = [
        { field: 'id', message: 'must not be null' },
      ];
      mockApi.onGet('/admin/stats').reply(400, {
        message: 'Validation failed',
        violations,
        path: '/admin/stats',
      });

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error.violations).toEqual(violations);
      expect(error.path).toBe('/admin/stats');
    });
  });

  // Network errors
  describe('network errors', () => {
    it('handles connection refused (network error)', async () => {
      mockApi.onGet('/admin/stats').networkError();

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.isRetryable).toBe(true);
    });

    // Note: axios-mock-adapter doesn't have a specific timeoutError() method
    // Timeout handling is tested via the network error test above
  });

  // Response parsing
  describe('response parsing and edge cases', () => {
    it('handles partial response (missing optional fields)', async () => {
      const partialResponse = {
        totalMotorcycles: 142,
        byBrand: { Yamaha: 12 },
      };

      mockApi.onGet('/admin/stats').reply(200, partialResponse);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats).toEqual(partialResponse);
    });

    it('handles response with extra fields (forward compatibility)', async () => {
      const responseWithExtra = {
        ...buildCatalogStats(),
        newField: 'should be preserved',
        anotherField: { nested: true },
      };

      mockApi.onGet('/admin/stats').reply(200, responseWithExtra);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats.newField).toBe('should be preserved');
      expect(stats.anotherField).toEqual({ nested: true });
    });

    it('handles empty response body', async () => {
      mockApi.onGet('/admin/stats').reply(200, {});

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats).toEqual({});
    });

    it('handles null values in nested fields', async () => {
      const responseWithNulls = {
        totalMotorcycles: 142,
        byBrand: null,
        priceEur: {
          min: null,
          avg: 12430.5,
          max: null,
        },
      };

      mockApi.onGet('/admin/stats').reply(200, responseWithNulls);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats.byBrand).toBeNull();
      expect(stats.priceEur.min).toBeNull();
    });
  });

  // Signal/cancellation tests
  describe('abort signal handling', () => {
    it('accepts signal parameter for request cancellation', async () => {
      const controller = new AbortController();
      mockApi.onGet('/admin/stats').reply(200, { totalMotorcycles: 142 });

      const promise = getCatalogStats({ signal: controller.signal });
      // Should not throw immediately
      expect(promise).toBeInstanceOf(Promise);

      const stats = await promise;
      expect(stats).toEqual({ totalMotorcycles: 142 });
    });

    it('works without signal parameter (backwards compatibility)', async () => {
      mockApi.onGet('/admin/stats').reply(200, { totalMotorcycles: 142 });

      const stats = await getCatalogStats({});
      expect(stats).toEqual({ totalMotorcycles: 142 });
    });

    it('works when called with no parameters', async () => {
      mockApi.onGet('/admin/stats').reply(200, buildCatalogStats());

      const stats = await getCatalogStats();
      expect(stats.totalMotorcycles).toBe(142);
    });
  });

  // Data shape validation
  describe('response data validation', () => {
    it('handles response with all expected fields', async () => {
      const completeResponse = buildCatalogStats();
      mockApi.onGet('/admin/stats').reply(200, completeResponse);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats).toEqual(completeResponse);
    });

    it('preserves numeric precision in response', async () => {
      const response = {
        totalMotorcycles: 142,
        priceEur: {
          min: 3990,
          avg: 12430.555555,
          max: 45000,
          pricedCount: 120,
        },
      };

      mockApi.onGet('/admin/stats').reply(200, response);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats.priceEur.avg).toBe(12430.555555);
    });

    it('preserves zero values in response', async () => {
      const response = {
        totalMotorcycles: 0,
        byBrand: {},
        motorcycleFieldGaps: {
          priceEur: 0,
          engineType: 0,
        },
      };

      mockApi.onGet('/admin/stats').reply(200, response);

      const stats = await getCatalogStats({ signal: new AbortController().signal });
      expect(stats.totalMotorcycles).toBe(0);
      expect(stats.motorcycleFieldGaps.engineType).toBe(0);
    });
  });

  // Error message handling
  describe('error message handling', () => {
    it('uses custom error message from server', async () => {
      mockApi.onGet('/admin/stats').reply(500, { message: 'Custom server error message' });

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      expect(error.message).toBe('Custom server error message');
    });

    it('handles missing message field in error response', async () => {
      mockApi.onGet('/admin/stats').reply(500, {});

      const error = await getCatalogStats({ signal: new AbortController().signal }).catch(
        (e) => e,
      );

      // Should fall back to status text or generic message
      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.status).toBe(500);
    });
  });
});
