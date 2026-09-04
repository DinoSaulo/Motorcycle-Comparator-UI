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
    frameType: 'Steel trellis',
    frontBrake: 'Double disc, 298 mm',
    rearBrake: 'Single disc, 245 mm',
    frontSuspension: 'Telescopic fork',
    rearSuspension: 'Swingarm',
    absType: 'ABS',
    frontTyre: '120/70 ZR17',
    rearTyre: '160/60 ZR17',
    engine: {
      engineType: 'Parallel-twin',
      displacementCc: 689,
      cylinders: 2,
      valvesPerCylinder: 4,
      maxPowerHp: 73.4,
      maxPowerRpm: 8750,
      maxTorqueNm: 67,
      maxTorqueRpm: 6500,
      compressionRatio: '12:1',
      boreMm: 80.5,
      strokeMm: 68,
      coolingSystem: 'Liquid',
      fuelSystem: 'Fuel injection',
      transmissionType: 'Manual',
      gears: 6,
      finalDrive: 'Chain',
      topSpeedKph: 200,
      fuelConsumptionL100km: 4.8,
      emissionStandard: 'Euro 5',
    },
    dimension: {
      lengthMm: 2124,
      widthMm: 745,
      heightMm: 1040,
      wheelbaseMm: 1400,
      seatHeightMm: 805,
      groundClearanceMm: 130,
      kerbWeightKg: 184,
      dryWeightKg: null,
      fuelCapacityL: 14,
      payloadKg: 210,
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
          { label: 'Category', unit: null, winnerIndexes: [], values: ['NAKED', 'SPORT'], differing: true },
          { label: 'Model year', unit: null, winnerIndexes: [], values: ['2024', '2024'], differing: false },
        ],
      },
      {
        name: 'Engine',
        rows: [
          { label: 'Max power', unit: 'hp', winnerIndexes: [1], values: ['73.4', '119'], differing: true },
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

export function buildCatalogStats(overrides = {}) {
  return {
    totalMotorcycles: 142,
    byBrand: {
      Yamaha: 12,
      Honda: 9,
      BMW: 8,
      Kawasaki: 7,
      Ducati: 6,
      KTM: 5,
      Suzuki: 4,
      Royal: 3,
      Triumph: 2,
      Aprilia: 1,
    },
    byCategory: {
      NAKED: 30,
      SPORT: 18,
      TOURING: 15,
      ADVENTURE: 12,
      CRUISER: 10,
      SCOOTER: 8,
      OFF_ROAD: 7,
      SUPERMOTO: 6,
      ELECTRIC: 36,
    },
    byModelYear: {
      '2020': 10,
      '2021': 15,
      '2022': 20,
      '2023': 30,
      '2024': 40,
      '2025': 27,
    },
    priceEur: {
      min: 3990,
      avg: 12430.5,
      max: 45000,
      pricedCount: 120,
    },
    lastUpdatedAt: '2026-09-03T10:15:30Z',
    motorcycleFieldGaps: {
      priceEur: 22,
      imageUrl: 60,
      description: 5,
      frameType: 3,
      frontSuspension: 4,
      rearSuspension: 4,
      frontBrake: 2,
      rearBrake: 2,
      absType: 30,
      frontTyre: 6,
      rearTyre: 6,
      engine: 1,
      dimension: 8,
    },
    engineSpecifications: {
      totalRows: 141,
      motorcyclesWithoutRow: 1,
      fieldGaps: {
        engineType: 0,
        displacementCc: 0,
        cylinders: 2,
        valvesPerCylinder: 10,
        maxPowerHp: 0,
        maxPowerRpm: 15,
        maxTorqueNm: 0,
        maxTorqueRpm: 15,
        compressionRatio: 20,
        boreMm: 25,
        strokeMm: 25,
        coolingSystem: 3,
        fuelSystem: 8,
        transmissionType: 5,
        gears: 5,
        finalDrive: 4,
        topSpeedKph: 30,
        fuelConsumptionL100km: 40,
        emissionStandard: 12,
      },
    },
    dimensions: {
      totalRows: 134,
      motorcyclesWithoutRow: 8,
      fieldGaps: {
        lengthMm: 10,
        widthMm: 10,
        heightMm: 12,
        wheelbaseMm: 5,
        seatHeightMm: 3,
        groundClearanceMm: 20,
        kerbWeightKg: 6,
        dryWeightKg: 40,
        fuelCapacityL: 8,
        payloadKg: 35,
      },
    },
    additionalSpecs: {
      totalEntries: 210,
      motorcyclesWithoutAny: 45,
    },
    ...overrides,
  };
}
