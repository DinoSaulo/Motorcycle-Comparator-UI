import { api, pruneParams } from './api';

/** The comparison endpoint rejects anything outside this range with a 400. */
export const COMPARISON_MIN = 2;
export const COMPARISON_MAX = 4;

/** Mirrors `com.motorcycle.comparison.entity.Category`. */
export const CATEGORIES = [
  'SPORT',
  'NAKED',
  'TOURING',
  'ADVENTURE',
  'CRUISER',
  'SCOOTER',
  'OFF_ROAD',
  'SUPERMOTO',
  'ELECTRIC',
];

// GET /motorcycles — searches motorcycles with paged filter envelope response.
export async function searchMotorcycles({
  filter = {},
  page = 0,
  size = 20,
  sort = 'brand,asc',
  signal,
} = {}) {
  const { data } = await api.get('/motorcycles', {
    params: pruneParams({ ...filter, page, size, sort }),
    signal,
  });
  return data;
}

/** `GET /motorcycles/brands` — distinct brands, for the filter sidebar. */
export function listBrands({ signal } = {}) {
  return api.get('/motorcycles/brands', { signal }).then((res) => res.data);
}

// GET /motorcycles/{id} — fetches motorcycle by ID with URL encoding.
export async function getMotorcycleById(id, { signal } = {}) {
  const { data } = await api.get(`/motorcycles/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** `GET /motorcycles/slug/{slug}`. */
export async function getMotorcycleBySlug(slug, { signal } = {}) {
  const { data } = await api.get(`/motorcycles/slug/${encodeURIComponent(slug)}`, { signal });
  return data;
}

// GET /motorcycles/compare?ids=1,2,3 — requests comparison matrix for 2-4 motorcycles.
export async function compareMotorcycles(ids, { signal } = {}) {
  // Enforces 2-4 ID limit contract to prevent unnecessary 400 API requests.
  if (!Array.isArray(ids) || ids.length < COMPARISON_MIN || ids.length > COMPARISON_MAX) {
    throw new Error(`compareMotorcycles requires ${COMPARISON_MIN}-${COMPARISON_MAX} ids`);
  }

  const { data } = await api.get('/motorcycles/compare', {
    params: { ids: ids.join(',') },
    signal,
  });
  return data;
}

// --- administration (ADMIN role required) ------------------------------------

/** `POST /motorcycles` — returns the created motorcycle. */
export async function createMotorcycle(payload) {
  const { data } = await api.post('/motorcycles', payload);
  return data;
}

// PUT /motorcycles/{id} — full replacement: omitted optional fields are cleared.
export async function updateMotorcycle(id, payload) {
  const { data } = await api.put(`/motorcycles/${encodeURIComponent(id)}`, payload);
  return data;
}

/** `DELETE /motorcycles/{id}` — 204, no body. */
export async function deleteMotorcycle(id) {
  await api.delete(`/motorcycles/${encodeURIComponent(id)}`);
}

/** Formats the API accepts, and the cap it enforces. Mirrored client-side to fail fast. */
export const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// POST /motorcycles/{id}/image — multipart upload endpoint.
export async function uploadMotorcycleImage(id, file, { onProgress } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/motorcycles/${encodeURIComponent(id)}/image`, formData, {
    // A 5 MB upload can outlast the default read timeout on a slow disk.
    timeout: 60_000,
    onUploadProgress: onProgress
      ? (event) => onProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0)
      : undefined,
  });
  return data;
}

/** `DELETE /motorcycles/{id}/image` — clears the image, returns the updated motorcycle. */
export async function deleteMotorcycleImage(id) {
  const { data } = await api.delete(`/motorcycles/${encodeURIComponent(id)}/image`);
  return data;
}
