import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';

// Singleton axios-mock-adapter wrapping the shared API client for integration testing.
// Resets automatically between tests to prevent route handler leakage.
export const mockApi = new MockAdapter(api, { onNoMatch: 'throwException' });

/** Shape of an `ApiError` body, as documented in CLAUDE.md. */
export function apiErrorBody({ message = 'Something went wrong', violations = [], path = '/api/v1/x' } = {}) {
  return { message, violations, path };
}
