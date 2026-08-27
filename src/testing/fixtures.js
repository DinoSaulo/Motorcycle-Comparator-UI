// Shared sample data mirroring the API contract for test suites.
import { setStoredToken } from '../services/api';

/** Where `authService` keeps the non-sensitive half of a session. */
export const SESSION_STORAGE_KEY = 'motorcycle-comparator.session';

export function buildMotorcycle(overrides = {}) {
  return {
    id: 1,
    slug: 'yamaha-mt-07-2024',
    brand: 'Yamaha',
    model: 'MT-07',
    displayName: null,
    modelYear: 2024,
    category: 'NAKED',
    priceEur: 8299,
    description: 'A punchy middleweight naked bike.',
    engine: {
      displacementCc: 689,
      powerHp: 73.4,
      powerKw: 54,
      powerRpm: 8750,
      torqueNm: 67,
      torqueRpm: 6500,
      strokeType: 'Four-stroke',
      cylinders: 2,
      valvesPerCylinder: 4,
      cooling: 'Liquid',
      transmission: 'Chain',
      gears: 6,
    },
    chassis: {
      frontBrake: 'Double disc, 298 mm',
      rearBrake: 'Single disc, 245 mm',
      frontSuspension: 'Telescopic fork',
      rearSuspension: 'Swingarm',
    },
    dimensions: {
      dryWeightKg: 184,
      fuelCapacityL: 14,
      seatHeightMm: 805,
      wheelbaseMm: 1400,
    },
    additionalSpecs: {
      Warranty: '2 years',
    },
    imageUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildPage(content = [buildMotorcycle()], overrides = {}) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 20,
    first: true,
    last: true,
    ...overrides,
  };
}

export function buildComparison(motorcycles = [buildMotorcycle({ id: 1 }), buildMotorcycle({ id: 2, model: 'MT-09' })]) {
  return {
    motorcycles,
    groups: [
      {
        name: 'Overview',
        rows: [
          { label: 'Category', unit: null, winnerIndexes: [], values: ['NAKED', 'NAKED'], differing: false },
          { label: 'Model year', unit: null, winnerIndexes: [], values: ['2024', '2024'], differing: false },
        ],
      },
      {
        name: 'Engine',
        rows: [
          { label: 'Displacement', unit: 'cc', winnerIndexes: [1], values: ['689', '890'], differing: true },
          { label: 'Power', unit: 'hp', winnerIndexes: [1], values: ['73.4', '119'], differing: true },
        ],
      },
    ],
  };
}

export function buildSession(overrides = {}) {
  return {
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    username: 'admin',
    roles: ['ROLE_ADMIN'],
    ...overrides,
  };
}

// Seeds authenticated session state (sessionStorage metadata and in-memory bearer token).
export function seedStoredSession(session = buildSession()) {
  const { username, roles, expiresAt, accessToken } = session;
  try {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ username, roles, expiresAt }),
    );
  } catch {
    /* mirrors authService: a storage failure must not fail the test setup */
  }
  setStoredToken(accessToken);
  return session;
}

export function buildApiError({ message = 'Something went wrong', status = 400, violations = [], path = '/api/v1/x' } = {}) {
  return { message, status, violations, path };
}
