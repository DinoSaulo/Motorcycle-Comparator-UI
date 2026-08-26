import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBrands, useComparison, useComparisonSelection, useMotorcycles } from './useMotorcycles';
import { mockApi } from '../testing/mockApi';
import { buildComparison, buildMotorcycle, buildPage } from '../testing/fixtures';

afterEach(() => {
  mockApi.reset();
});

describe('useMotorcycles', () => {
  it('loads the first page and exposes the results', async () => {
    const page = buildPage([buildMotorcycle()]);
    mockApi.onGet('/motorcycles').reply(200, page);

    const { result } = renderHook(() => useMotorcycles());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.motorcycles).toEqual(page.content);
    expect(result.current.pageInfo).toEqual(page);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a request failure through error and resets to the empty page', async () => {
    mockApi.onGet('/motorcycles').reply(500, { message: 'boom' });

    const { result } = renderHook(() => useMotorcycles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.motorcycles).toEqual([]);
  });

  it('does not fetch at all when disabled', async () => {
    let called = false;
    mockApi.onGet('/motorcycles').reply(() => {
      called = true;
      return [200, buildPage()];
    });

    const { result } = renderHook(() => useMotorcycles({ enabled: false }));
    expect(result.current.loading).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(called).toBe(false);
  });

  it('refetches when refetch() is called', async () => {
    let hits = 0;
    mockApi.onGet('/motorcycles').reply(() => {
      hits += 1;
      return [200, buildPage()];
    });

    const { result } = renderHook(() => useMotorcycles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(hits).toBe(1);

    act(() => result.current.refetch());
    await waitFor(() => expect(hits).toBe(2));
  });

  it('re-fetches when the filter object changes by value even with a new identity', async () => {
    let receivedParams = [];
    mockApi.onGet('/motorcycles').reply((config) => {
      receivedParams.push(config.params);
      return [200, buildPage()];
    });

    const { result, rerender } = renderHook(({ filter }) => useMotorcycles({ filter }), {
      initialProps: { filter: { brand: 'Yamaha' } },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ filter: { brand: 'Honda' } });
    await waitFor(() => expect(receivedParams).toHaveLength(2));
    expect(receivedParams[1].brand).toBe('Honda');
  });

  it('does not re-fetch when an equivalent filter object is passed with a new identity', async () => {
    let hits = 0;
    mockApi.onGet('/motorcycles').reply(() => {
      hits += 1;
      return [200, buildPage()];
    });

    const { result, rerender } = renderHook(({ filter }) => useMotorcycles({ filter }), {
      initialProps: { filter: { brand: 'Yamaha' } },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ filter: { brand: 'Yamaha' } });
    await new Promise((r) => setTimeout(r, 0));
    expect(hits).toBe(1);
  });
});

describe('useBrands', () => {
  it('loads the brand list', async () => {
    mockApi.onGet('/motorcycles/brands').reply(200, ['Yamaha', 'Honda']);
    const { result } = renderHook(() => useBrands());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brands).toEqual(['Yamaha', 'Honda']);
  });

  it('degrades to an empty list on failure instead of throwing', async () => {
    mockApi.onGet('/motorcycles/brands').reply(500);
    const { result } = renderHook(() => useBrands());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brands).toEqual([]);
  });
});

describe('useComparison', () => {
  it('skips the request when there are fewer than 2 ids', () => {
    const { result } = renderHook(() => useComparison(['1']));
    expect(result.current.loading).toBe(false);
    expect(result.current.comparison).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('skips the request when there are more than 4 ids', () => {
    const { result } = renderHook(() => useComparison(['1', '2', '3', '4', '5']));
    expect(result.current.loading).toBe(false);
    expect(result.current.comparison).toBeNull();
  });

  it('fetches the comparison for 2..4 ids', async () => {
    const comparison = buildComparison();
    mockApi.onGet('/motorcycles/compare').reply(200, comparison);

    const { result } = renderHook(() => useComparison(['1', '2']));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comparison).toEqual(comparison);
  });

  it('surfaces a comparison request failure', async () => {
    mockApi.onGet('/motorcycles/compare').reply(400, { message: 'bad ids' });
    const { result } = renderHook(() => useComparison(['1', '2']));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.comparison).toBeNull();
  });

  it('re-fetches when the id list changes', async () => {
    let hits = 0;
    mockApi.onGet('/motorcycles/compare').reply(() => {
      hits += 1;
      return [200, buildComparison()];
    });

    const { result, rerender } = renderHook(({ ids }) => useComparison(ids), {
      initialProps: { ids: ['1', '2'] },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ ids: ['1', '2', '3'] });
    await waitFor(() => expect(hits).toBe(2));
  });
});

describe('useComparisonSelection', () => {
  function makeParams(query = '') {
    return new URLSearchParams(query);
  }

  it('parses no ids from an empty query string', () => {
    const { result } = renderHook(() => useComparisonSelection(makeParams(), vi.fn()));
    expect(result.current.ids).toEqual([]);
  });

  it('parses, trims and de-duplicates a comma-separated ids param', () => {
    const { result } = renderHook(() => useComparisonSelection(makeParams('ids=1, 2,2,3'), vi.fn()));
    expect(result.current.ids).toEqual(['1', '2', '3']);
  });

  it('drops non-numeric junk from a hand-edited URL', () => {
    const { result } = renderHook(() => useComparisonSelection(makeParams('ids=1,abc,3'), vi.fn()));
    expect(result.current.ids).toEqual(['1', '3']);
  });

  it('setIds writes a comma-joined ids param', () => {
    const setSearchParams = vi.fn();
    const { result } = renderHook(() => useComparisonSelection(makeParams(), setSearchParams));

    act(() => result.current.setIds(['1', '2']));

    expect(setSearchParams).toHaveBeenCalledWith(expect.any(URLSearchParams), { replace: false });
    const [params] = setSearchParams.mock.calls[0];
    expect(params.get('ids')).toBe('1,2');
  });

  it('setIds([]) removes the ids param entirely', () => {
    const setSearchParams = vi.fn();
    const { result } = renderHook(() => useComparisonSelection(makeParams('ids=1,2'), setSearchParams));

    act(() => result.current.setIds([]));

    const [params] = setSearchParams.mock.calls[0];
    expect(params.has('ids')).toBe(false);
  });
});
