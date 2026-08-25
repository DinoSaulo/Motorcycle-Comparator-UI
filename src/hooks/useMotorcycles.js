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

/**
 * Paged catalogue search.
 *
 * Every run is tied to an `AbortController` so a superseded request can never
 * overwrite the results of a newer one — the classic autocomplete race.
 */
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

/**
 * The side-by-side comparison for `ids`.
 *
 * Skips the request entirely when the selection is outside the 2–4 the endpoint
 * accepts, so a half-built selection never triggers a guaranteed 400.
 */
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

/**
 * Reads and writes the compared ids as a `?ids=1,2,3` query string.
 *
 * The URL *is* the state: the backend deliberately exposes comparison as a GET so the
 * page stays shareable and bookmarkable, and duplicating that into a store would only
 * create a second source of truth to keep in sync.
 */
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
