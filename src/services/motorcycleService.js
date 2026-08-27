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

/**
 * `GET /motorcycles` — every filter is optional and combinable.
 *
 * Returns Spring's `Page` envelope: `{ content, totalElements, totalPages, number, size, first, last }`.
 */
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
export async function listBrands({ signal } = {}) {
  const { data } = await api.get('/motorcycles/brands', { signal });
  return data;
}

/**
 * `GET /motorcycles/{id}`.
 *
 * Every path segment below goes through `encodeURIComponent`: ids and slugs arrive from
 * route params, which are whatever the user typed in the address bar. Unencoded, a `/`
 * or `#` would silently re-target the request at a different endpoint rather than 404.
 */
export async function getMotorcycleById(id, { signal } = {}) {
  const { data } = await api.get(`/motorcycles/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** `GET /motorcycles/slug/{slug}`. */
export async function getMotorcycleBySlug(slug, { signal } = {}) {
  const { data } = await api.get(`/motorcycles/slug/${encodeURIComponent(slug)}`, { signal });
  return data;
}

/**
 * `GET /motorcycles/compare?ids=1,2,3`
 *
 * The response arrives pre-shaped as table rows — the backend owns every spec label,
 * unit, display order and "which value wins", so the table component stays a dumb renderer.
 *
 * Ids are joined manually: Spring binds `List<Long>` from one comma-separated value,
 * whereas axios would otherwise serialise the array as `ids[]=1&ids[]=2`.
 */
export async function compareMotorcycles(ids, { signal } = {}) {
  // The bound belongs to the endpoint's contract, not to the screen that happens to call
  // it: enforcing it here means a caller reaching past `useComparison` cannot spend a round
  // trip on a request the API is guaranteed to refuse.
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

/**
 * `PUT /motorcycles/{id}` — a **full replacement**: any optional field left out of the
 * payload is cleared, so callers must send the complete record, not just what changed.
 */
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

/**
 * `POST /motorcycles/{id}/image` — multipart upload, returns the updated motorcycle.
 *
 * The Content-Type header is deliberately not set: the browser has to add the multipart
 * boundary itself, and naming the type here would strip it.
 */
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
