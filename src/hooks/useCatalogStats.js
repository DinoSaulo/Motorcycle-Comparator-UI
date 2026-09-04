import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getCatalogStats } from '../services/adminStatsService';

// Fetches catalogue stats on mount with AbortController cleanup; cancellation is not an error.
export function useCatalogStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getCatalogStats({ signal: controller.signal })
      .then((result) => {
        setStats(result);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(err);
        setStats(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { stats, loading, error, refetch };
}
