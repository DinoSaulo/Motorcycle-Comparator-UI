import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  COMPARISON_MAX,
  COMPARISON_MIN,
  compareMotorcycles,
  listBrands,
  searchMotorcycles,
} from '../services/motorcycleService';

const EMPTY_PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };

// Paged catalogue search with AbortController to prevent race conditions.
export function useMotorcycles({ filter, page = 0, size = 20, sort = 'brand,asc', enabled = true } = {}) {
  const [page_, setPage] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Serialised so the effect compares filters by value, not by object identity —
  // callers overwhelmingly pass an inline literal.
  const filterKey = JSON.stringify(filter ?? {});

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    searchMotorcycles({ filter: JSON.parse(filterKey), page, size, sort, signal: controller.signal })
      .then((result) => {
        setPage(result);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(err);
        setPage(EMPTY_PAGE);
        setLoading(false);
      });

    return () => controller.abort();
  }, [filterKey, page, size, sort, enabled, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return {
    motorcycles: page_.content ?? [],
    pageInfo: page_,
    loading,
    error,
    refetch,
  };
}

/** The distinct brand list backing the filter sidebar. Fetched once per mount. */
export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    listBrands({ signal: controller.signal })
      .then((result) => {
        setBrands(result);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        // A missing brand list degrades the sidebar, it does not break the page.
        setBrands([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { brands, loading };
}

// Side-by-side comparison hook that validates 2-4 bike limits before fetching.
export function useComparison(ids) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const idsKey = ids.join(',');

  useEffect(() => {
    const requested = idsKey ? idsKey.split(',') : [];

    if (requested.length < COMPARISON_MIN || requested.length > COMPARISON_MAX) {
      setComparison(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    compareMotorcycles(requested, { signal: controller.signal })
      .then((result) => {
        setComparison(result);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(err);
        setComparison(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [idsKey]);

  return { comparison, loading, error };
}

// Synchronizes motorcycle comparison selection with shareable ?ids=1,2,3 URL parameters.
export function useComparisonSelection(searchParams, setSearchParams) {
  const ids = useMemo(() => {
    const raw = searchParams.get('ids');
    if (!raw) return [];
    // De-duplicated and integer-checked here so a hand-edited URL cannot push
    // junk into a request the API would reject.
    return [...new Set(raw.split(',').map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))];
  }, [searchParams]);

  const setIds = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams);
      if (next.length === 0) {
        params.delete('ids');
      } else {
        params.set('ids', next.join(','));
      }
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  return { ids, setIds };
}
