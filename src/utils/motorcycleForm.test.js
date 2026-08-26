import { describe, expect, it } from 'vitest';
import {
  ADDITIONAL_SPECS_MAX,
  CHASSIS_FIELDS,
  DIMENSION_FIELDS,
  ENGINE_FIELDS,
  IDENTITY_FIELDS,
  emptyFormState,
  toFormState,
  toPayload,
  validate,
} from './motorcycleForm';
import { buildMotorcycle } from '../testing/fixtures';

describe('emptyFormState', () => {
  it('seeds every top-level identity/chassis field with an empty string, never undefined', () => {
    const state = emptyFormState();
    for (const field of [...IDENTITY_FIELDS, ...CHASSIS_FIELDS]) {
      expect(state[field.name]).toBe('');
    }
  });

  it('seeds every engine and dimension field inside its nested block', () => {
    const state = emptyFormState();
    for (const field of ENGINE_FIELDS) {
      expect(state.engine[field.name]).toBe('');
    }
    for (const field of DIMENSION_FIELDS) {
      expect(state.dimension[field.name]).toBe('');
    }
  });

  it('starts imageUrl null and additionalSpecs empty', () => {
    const state = emptyFormState();
    expect(state.imageUrl).toBeNull();
    expect(state.additionalSpecs).toEqual([]);
  });
});

describe('toFormState', () => {
  it('returns an empty form state when given no motorcycle', () => {
    expect(toFormState(null)).toEqual(emptyFormState());
  });

  it('stringifies every populated field', () => {
    const motorcycle = buildMotorcycle();
    const state = toFormState(motorcycle);

    expect(state.brand).toBe('Yamaha');
    expect(state.modelYear).toBe('2024');
    expect(state.priceEur).toBe('8299');
    expect(state.engine.displacementCc).toBe('689');
    expect(state.dimension.kerbWeightKg).toBe('184');
  });

  it('renders a null nested value as an empty string, not "null"', () => {
    const motorcycle = buildMotorcycle();
    const state = toFormState(motorcycle);
    expect(state.dimension.dryWeightKg).toBe('');
  });

  it('carries imageUrl through untouched', () => {
    const state = toFormState(buildMotorcycle({ imageUrl: '/api/v1/images/motorcycles/1.jpg' }));
    expect(state.imageUrl).toBe('/api/v1/images/motorcycles/1.jpg');
  });

  it('defaults a missing imageUrl to null', () => {
    const { imageUrl, ...rest } = buildMotorcycle();
    const state = toFormState(rest);
    expect(state.imageUrl).toBeNull();
  });

  it('converts additionalSpecs from an object map to a list of {key, value} pairs', () => {
    const state = toFormState(buildMotorcycle({ additionalSpecs: { Warranty: '2 years', Colour: 'Blue' } }));
    expect(state.additionalSpecs).toEqual([
      { key: 'Warranty', value: '2 years' },
      { key: 'Colour', value: 'Blue' },
    ]);
  });

  it('handles a motorcycle with no additionalSpecs at all', () => {
    const motorcycle = buildMotorcycle();
    delete motorcycle.additionalSpecs;
    expect(toFormState(motorcycle).additionalSpecs).toEqual([]);
  });

  it('handles a motorcycle with no nested engine/dimension object', () => {
    const motorcycle = buildMotorcycle({ engine: undefined, dimension: undefined });
    const state = toFormState(motorcycle);
    expect(state.engine.displacementCc).toBe('');
    expect(state.dimension.kerbWeightKg).toBe('');
  });
});

describe('toPayload', () => {
  it('round-trips a fully populated form state into the request shape', () => {
    const state = toFormState(buildMotorcycle());
    const payload = toPayload(state);

    expect(payload.brand).toBe('Yamaha');
    expect(payload.modelYear).toBe(2024);
    expect(payload.priceEur).toBe(8299);
    expect(payload.engine.displacementCc).toBe(689);
    expect(payload.dimension.kerbWeightKg).toBe(184);
  });

  it('converts a blank text field to null, never an empty string', () => {
    const state = emptyFormState();
    state.brand = '';
    expect(toPayload(state).brand).toBeNull();
  });

  it('converts a blank numeric field to null, never 0', () => {
    const state = emptyFormState();
    state.modelYear = '';
    expect(toPayload(state).modelYear).toBeNull();
  });

  it('trims whitespace-only text fields down to null', () => {
    const state = emptyFormState();
    state.frameType = '   ';
    expect(toPayload(state).frameType).toBeNull();
  });

  it('always sends engine, even fully blank, because it is @NotNull upstream', () => {
    const payload = toPayload(emptyFormState());
    expect(payload.engine).toBeDefined();
    expect(payload.engine.displacementCc).toBeNull();
  });

  it('sends dimension as null when every dimension field is blank', () => {
    const payload = toPayload(emptyFormState());
    expect(payload.dimension).toBeNull();
  });

  it('sends a populated dimension block when at least one field has a value', () => {
    const state = emptyFormState();
    state.dimension.kerbWeightKg = '184';
    const payload = toPayload(state);
    expect(payload.dimension).not.toBeNull();
    expect(payload.dimension.kerbWeightKg).toBe(184);
    expect(payload.dimension.lengthMm).toBeNull();
  });

  it('carries a null imageUrl through as null', () => {
    const state = emptyFormState();
    expect(toPayload(state).imageUrl).toBeNull();
  });

  it('drops additionalSpecs entries with a blank key', () => {
    const state = emptyFormState();
    state.additionalSpecs = [
      { key: 'Warranty', value: '2 years' },
      { key: '  ', value: 'orphan value' },
    ];
    const payload = toPayload(state);
    expect(payload.additionalSpecs).toEqual({ Warranty: '2 years' });
  });

  it('trims additionalSpecs keys', () => {
    const state = emptyFormState();
    state.additionalSpecs = [{ key: '  Colour  ', value: 'Blue' }];
    expect(toPayload(state).additionalSpecs).toEqual({ Colour: 'Blue' });
  });
});

describe('validate', () => {
  const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key);

  function validState() {
    const state = emptyFormState();
    state.brand = 'Yamaha';
    state.model = 'MT-07';
    state.category = 'NAKED';
    state.modelYear = '2024';
    return state;
  }

  it('returns no errors for a minimally valid state', () => {
    expect(validate(validState(), t)).toEqual({});
  });

  it('requires brand', () => {
    const state = validState();
    state.brand = '   ';
    expect(validate(state, t).brand).toBe('validation.brandRequired');
  });

  it('requires model', () => {
    const state = validState();
    state.model = '';
    expect(validate(state, t).model).toBe('validation.modelRequired');
  });

  it('requires category', () => {
    const state = validState();
    state.category = '';
    expect(validate(state, t).category).toBe('validation.categoryRequired');
  });

  it('requires modelYear', () => {
    const state = validState();
    state.modelYear = '';
    expect(validate(state, t).modelYear).toBe('validation.modelYearRequired');
  });

  it('rejects a modelYear below the historical floor', () => {
    const state = validState();
    state.modelYear = '1800';
    expect(validate(state, t).modelYear).toBe('validation.modelYearRange');
  });

  it('rejects a modelYear above the ceiling', () => {
    const state = validState();
    state.modelYear = '2200';
    expect(validate(state, t).modelYear).toBe('validation.modelYearRange');
  });

  it('rejects a non-numeric modelYear', () => {
    const state = validState();
    state.modelYear = 'abcd';
    expect(validate(state, t).modelYear).toBe('validation.modelYearRange');
  });

  it('accepts the boundary years', () => {
    const low = validState();
    low.modelYear = '1885';
    expect(validate(low, t).modelYear).toBeUndefined();

    const high = validState();
    high.modelYear = '2100';
    expect(validate(high, t).modelYear).toBeUndefined();
  });

  it('allows an empty price', () => {
    const state = validState();
    state.priceEur = '';
    expect(validate(state, t).priceEur).toBeUndefined();
  });

  it('rejects a zero or negative price', () => {
    const state = validState();
    state.priceEur = '0';
    expect(validate(state, t).priceEur).toBe('validation.priceMustBePositive');
  });

  it('accepts a positive price', () => {
    const state = validState();
    state.priceEur = '100';
    expect(validate(state, t).priceEur).toBeUndefined();
  });

  it('rejects more than the max number of additional specs', () => {
    const state = validState();
    state.additionalSpecs = Array.from({ length: ADDITIONAL_SPECS_MAX + 1 }, (_, i) => ({
      key: `k${i}`,
      value: 'v',
    }));
    expect(validate(state, t).additionalSpecs).toBe(
      `validation.tooManyAdditionalSpecs:${JSON.stringify({ max: ADDITIONAL_SPECS_MAX })}`,
    );
  });

  it('rejects an additional spec with a value but no name', () => {
    const state = validState();
    state.additionalSpecs = [{ key: '', value: 'orphan' }];
    expect(validate(state, t).additionalSpecs).toBe('validation.additionalSpecNeedsName');
  });

  it('allows a fully blank additional spec row (not yet filled in)', () => {
    const state = validState();
    state.additionalSpecs = [{ key: '', value: '' }];
    expect(validate(state, t).additionalSpecs).toBeUndefined();
  });

  it('falls back to the built-in English messages when no translator is supplied', () => {
    const state = emptyFormState();
    const errors = validate(state);
    expect(errors.brand).toBe('Brand is required');
    expect(errors.modelYear).toBe('Model year is required');
  });
});
