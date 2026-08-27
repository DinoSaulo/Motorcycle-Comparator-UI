/**
 * Shared sample data mirroring the API contract described in CLAUDE.md and the
 * backend DTOs. Kept in one place so every test file compares against the same
 * shapes instead of hand-rolling slightly different ones.
 */
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
    imageUrl: null,
    frameType: 'Steel diamond',
    frontSuspension: '41mm telescopic fork',
    rearSuspension: 'Single shock',
    frontBrake: 'Dual 298mm discs',
    rearBrake: '245mm disc',
    absType: 'Dual-channel',
    frontTyre: '120/70ZR17',
    rearTyre: '180/55ZR17',
    engine: {
      engineType: 'Parallel-twin',
      displacementCc: 689,
      cylinders: 2,
      valvesPerCylinder: 4,
      maxPowerHp: 73.4,
      maxPowerRpm: 8750,
      maxTorqueNm: 68.6,
      maxTorqueRpm: 6500,
      compressionRatio: '11.5:1',
      boreMm: 80,
      strokeMm: 68.6,
      coolingSystem: 'Liquid',
      fuelSystem: 'Fuel injection',
      transmissionType: 'Manual',
      gears: 6,
      finalDrive: 'Chain',
      topSpeedKph: 210,
      fuelConsumptionL100km: 4.6,
      emissionStandard: 'Euro 5',
    },
    dimension: {
      lengthMm: 2110,
      widthMm: 745,
      heightMm: 1090,
      wheelbaseMm: 1400,
      seatHeightMm: 805,
      groundClearanceMm: 140,
      kerbWeightKg: 184,
      dryWeightKg: null,
      fuelCapacityL: 14,
      payloadKg: 190,
    },
    additionalSpecs: { 'Warranty': '2 years' },
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

export function buildComparison(motorcycles = [buildMotorcycle(), buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R' })]) {
  return {
    motorcycles,
    groups: [
      {
        name: '',
        rows: [
          { label: 'Category', unit: null, values: motorcycles.map((m) => m.category), winnerIndexes: [], differing: motorcycles.some((m) => m.category !== motorcycles[0].category) },
          { label: 'Model year', unit: null, values: motorcycles.map((m) => m.modelYear), winnerIndexes: [], differing: false },
        ],
      },
      {
        name: 'Engine',
        rows: [
          {
            label: 'Max power',
            unit: 'hp',
            values: motorcycles.map((m) => m.engine.maxPowerHp),
            winnerIndexes: [0],
            differing: true,
          },
        ],
      },
    ],
  };
}

export function buildSession(overrides = {}) {
  return {
    accessToken: 'jwt.token.value',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    username: 'admin',
    roles: ['ROLE_ADMIN'],
    ...overrides,
  };
}

/**
 * Leaves the app in the state a real `login()` does: display metadata in `sessionStorage`,
 * bearer token in memory.
 *
 * Both halves are required. Since the token stopped being persisted (SEC-001) storage alone
 * restores nothing — which is precisely the reload behaviour `restoreSession` now enforces —
 * so any test that wants an authenticated render has to seed the token too.
 */
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
