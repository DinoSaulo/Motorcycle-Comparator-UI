import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useComparison, useComparisonSelection } from './useMotorcycles';
import { mockApi } from '../testing/mockApi';
import { buildComparison } from '../testing/fixtures';

afterEach(() => {
  mockApi.reset();
});

// Security tests asserting useComparison enforcement of 2-4 ID bounds.
describe('SEC: useComparison refuses to call the API outside the 2-4 id bound', () => {
  it('does not request the comparison for a single id', () => {
    renderHook(() => useComparison(['1']));
    expect(mockApi.history.get).toHaveLength(0);
  });

  it('does not request the comparison for zero ids', () => {
    renderHook(() => useComparison([]));
    expect(mockApi.history.get).toHaveLength(0);
  });

  it('does not request the comparison for more than 4 ids', () => {
    renderHook(() => useComparison(['1', '2', '3', '4', '5']));
    expect(mockApi.history.get).toHaveLength(0);
  });

  it('does request the comparison for a count inside the bound', async () => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison());
    renderHook(() => useComparison(['1', '2']));
    await waitFor(() => expect(mockApi.history.get).toHaveLength(1));
  });
});

// Security tests ensuring non-numeric URL parameters are sanitised before API request.
describe('SEC: useComparisonSelection sanitises ids parsed from the URL', () => {
  it('drops non-numeric ids so a hand-edited URL cannot inject anything but integers', () => {
    const params = new URLSearchParams();
    params.set('ids', '1,<script>,2,99;drop,4');

    const { result } = renderHook(() => useComparisonSelection(params, () => {}));

    expect(result.current.ids).toEqual(['1', '2', '4']);
  });

  it('de-duplicates repeated ids', () => {
    const params = new URLSearchParams();
    params.set('ids', '1,1,2');

    const { result } = renderHook(() => useComparisonSelection(params, () => {}));

    expect(result.current.ids).toEqual(['1', '2']);
  });
});
