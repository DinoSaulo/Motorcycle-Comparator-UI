import { api } from './api';

// GET /admin/stats — catalogue health: counts, breakdowns, completeness gaps.
export async function getCatalogStats({ signal } = {}) {
  const { data } = await api.get('/admin/stats', { signal });
  return data;
}
