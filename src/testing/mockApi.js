import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';

/**
 * One `axios-mock-adapter` instance wrapping the app's real, shared `api` client.
 *
 * Mocking at this layer — instead of `vi.mock('../services/...')` — keeps
 * `services/api.js` (interceptors, `ApiRequestError` normalisation, auth header
 * injection) exercised for real, which is the point of an integration test. Unit
 * tests for a single component/hook should prefer mocking the service module
 * directly; reach for this when a test wants the whole client stack involved.
 *
 * Call `mockApi.reset()` in `afterEach` (or `restore()` in `afterAll`) — the
 * adapter is shared across the whole api instance and leaks handlers otherwise.
 */
export const mockApi = new MockAdapter(api, { onNoMatch: 'throwException' });

/** Shape of an `ApiError` body, as documented in CLAUDE.md. */
export function apiErrorBody({ message = 'Something went wrong', violations = [], path = '/api/v1/x' } = {}) {
  return { message, violations, path };
}
