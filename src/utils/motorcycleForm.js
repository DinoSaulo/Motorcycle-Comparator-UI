import { CATEGORIES } from '../services/motorcycleService';

/**
 * Field descriptors for the admin form, declared once and rendered generically.
 *
 * Every `maxLength`, `min` and `max` here mirrors a bean-validation constraint on
 * `CreateMotorcycleRequest`. They exist to fail fast in the browser — the API still
 * validates everything, and its `violations` are what the user is ultimately shown.
 */

export const IDENTITY_FIELDS = [
  { name: 'brand', label: 'Brand', type: 'text', required: true, maxLength: 60 },
  { name: 'model', label: 'Model', type: 'text', required: true, maxLength: 120 },
  { name: 'modelYear', label: 'Model year', type: 'integer', required: true, min: 1885, max: 2100 },
  { name: 'category', label: 'Category', type: 'select', required: true, options: CATEGORIES },
  { name: 'priceEur', label: 'Price', type: 'decimal', unit: 'EUR', min: 0 },
  { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000, full: true },
];

export const CHASSIS_FIELDS = [
  { name: 'frameType', label: 'Frame type', type: 'text', maxLength: 120 },
  { name: 'frontSuspension', label: 'Front suspension', type: 'text', maxLength: 160 },
  { name: 'rearSuspension', label: 'Rear suspension', type: 'text', maxLength: 160 },
  { name: 'frontBrake', label: 'Front brake', type: 'text', maxLength: 160 },
  { name: 'rearBrake', label: 'Rear brake', type: 'text', maxLength: 160 },
  { name: 'absType', label: 'ABS type', type: 'text', maxLength: 80 },
  { name: 'frontTyre', label: 'Front tyre', type: 'text', maxLength: 60 },
  { name: 'rearTyre', label: 'Rear tyre', type: 'text', maxLength: 60 },
];

export const ENGINE_FIELDS = [
  { name: 'engineType', label: 'Engine type', type: 'text', maxLength: 80 },
  // Nullable on purpose upstream: an electric motor has no displacement.
  { name: 'displacementCc', label: 'Displacement', type: 'integer', unit: 'cc', min: 1 },
  { name: 'cylinders', label: 'Cylinders', type: 'integer', min: 1 },
  { name: 'valvesPerCylinder', label: 'Valves per cylinder', type: 'integer', min: 1 },
  { name: 'maxPowerHp', label: 'Max power', type: 'decimal', unit: 'hp', min: 0 },
  { name: 'maxPowerRpm', label: 'Power peak', type: 'integer', unit: 'rpm', min: 1 },
  { name: 'maxTorqueNm', label: 'Max torque', type: 'decimal', unit: 'Nm', min: 0 },
  { name: 'maxTorqueRpm', label: 'Torque peak', type: 'integer', unit: 'rpm', min: 1 },
  { name: 'compressionRatio', label: 'Compression ratio', type: 'text', maxLength: 20 },
  { name: 'boreMm', label: 'Bore', type: 'decimal', unit: 'mm', min: 0 },
  { name: 'strokeMm', label: 'Stroke', type: 'decimal', unit: 'mm', min: 0 },
  { name: 'coolingSystem', label: 'Cooling system', type: 'text', maxLength: 40 },
  { name: 'fuelSystem', label: 'Fuel system', type: 'text', maxLength: 120 },
  { name: 'transmissionType', label: 'Transmission', type: 'text', maxLength: 60 },
  { name: 'gears', label: 'Gears', type: 'integer', min: 1 },
  { name: 'finalDrive', label: 'Final drive', type: 'text', maxLength: 40 },
  { name: 'topSpeedKph', label: 'Top speed', type: 'integer', unit: 'km/h', min: 1 },
  { name: 'fuelConsumptionL100km', label: 'Fuel consumption', type: 'decimal', unit: 'l/100km', min: 0 },
  { name: 'emissionStandard', label: 'Emission standard', type: 'text', maxLength: 30 },
];

export const DIMENSION_FIELDS = [
  { name: 'lengthMm', label: 'Length', type: 'integer', unit: 'mm', min: 1 },
  { name: 'widthMm', label: 'Width', type: 'integer', unit: 'mm', min: 1 },
  { name: 'heightMm', label: 'Height', type: 'integer', unit: 'mm', min: 1 },
  { name: 'wheelbaseMm', label: 'Wheelbase', type: 'integer', unit: 'mm', min: 1 },
  { name: 'seatHeightMm', label: 'Seat height', type: 'integer', unit: 'mm', min: 1 },
  { name: 'groundClearanceMm', label: 'Ground clearance', type: 'integer', unit: 'mm', min: 1 },
  { name: 'kerbWeightKg', label: 'Kerb weight', type: 'decimal', unit: 'kg', min: 0 },
  { name: 'dryWeightKg', label: 'Dry weight', type: 'decimal', unit: 'kg', min: 0 },
  { name: 'fuelCapacityL', label: 'Fuel capacity', type: 'decimal', unit: 'l', min: 0 },
  { name: 'payloadKg', label: 'Payload', type: 'decimal', unit: 'kg', min: 0 },
];

/** Mirrors the bounds on `motorcycle_additional_specs`. */
export const ADDITIONAL_SPECS_MAX = 50;
export const ADDITIONAL_SPEC_KEY_MAX = 80;
export const ADDITIONAL_SPEC_VALUE_MAX = 500;

const ALL_SECTIONS = [
  ['', IDENTITY_FIELDS],
  ['', CHASSIS_FIELDS],
  ['engine', ENGINE_FIELDS],
  ['dimension', DIMENSION_FIELDS],
];

/** Empty strings, not nulls: a controlled input must never be handed `undefined`. */
export function emptyFormState() {
  const state = { imageUrl: null, engine: {}, dimension: {}, additionalSpecs: [] };
  for (const [block, fields] of ALL_SECTIONS) {
    for (const field of fields) {
      if (block) {
        state[block][field.name] = '';
      } else {
        state[field.name] = '';
      }
    }
  }
  return state;
}

/** API record → form state. */
export function toFormState(motorcycle) {
  const state = emptyFormState();
  if (!motorcycle) return state;

  for (const [block, fields] of ALL_SECTIONS) {
    for (const field of fields) {
      const source = block ? motorcycle[block] : motorcycle;
      const value = source?.[field.name];
      const text = value === null || value === undefined ? '' : String(value);
      if (block) {
        state[block][field.name] = text;
      } else {
        state[field.name] = text;
      }
    }
  }

  state.imageUrl = motorcycle.imageUrl ?? null;
  // A list of pairs, not an object: two rows may briefly share a key while being typed,
  // and an object would silently collapse them.
  state.additionalSpecs = Object.entries(motorcycle.additionalSpecs ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
  return state;
}

function toNumber(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const numeric = Number(raw);
  return Number.isNaN(numeric) ? null : numeric;
}

function toText(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : raw;
  return trimmed === '' || trimmed === undefined ? null : trimmed;
}

function convert(field, raw) {
  return field.type === 'integer' || field.type === 'decimal' ? toNumber(raw) : toText(raw);
}

function blockPayload(fields, values) {
  const payload = {};
  let hasAny = false;
  for (const field of fields) {
    const converted = convert(field, values?.[field.name]);
    payload[field.name] = converted;
    if (converted !== null) hasAny = true;
  }
  return { payload, hasAny };
}

/**
 * Form state → `CreateMotorcycleRequest`.
 *
 * Blank inputs become `null`, never `""` or `0`: the API's `@Positive`/`@Size` constraints
 * reject an empty string, and a zero would be stored as a real measurement.
 *
 * `imageUrl` is carried through untouched. PUT is a full replacement, so omitting it would
 * silently clear an image that was uploaded through the separate multipart endpoint.
 */
export function toPayload(state) {
  const payload = { imageUrl: state.imageUrl ?? null };

  for (const field of [...IDENTITY_FIELDS, ...CHASSIS_FIELDS]) {
    payload[field.name] = convert(field, state[field.name]);
  }

  // engine is @NotNull upstream, so it is always sent even when every field is blank.
  payload.engine = blockPayload(ENGINE_FIELDS, state.engine).payload;

  const dimension = blockPayload(DIMENSION_FIELDS, state.dimension);
  // dimension is optional, and a fully blank block means "no dimensions" rather than
  // a row of nulls — sending null lets orphanRemoval drop any existing one.
  payload.dimension = dimension.hasAny ? dimension.payload : null;

  payload.additionalSpecs = Object.fromEntries(
    state.additionalSpecs
      .filter((entry) => entry.key.trim() !== '')
      .map((entry) => [entry.key.trim(), entry.value]),
  );

  return payload;
}

/** Client-side gate for the few rules worth catching before a round trip. */
export function validate(state) {
  const errors = {};
  if (!state.brand.trim()) errors.brand = 'Brand is required';
  if (!state.model.trim()) errors.model = 'Model is required';
  if (!state.category) errors.category = 'Category is required';

  const year = Number(state.modelYear);
  if (!state.modelYear) {
    errors.modelYear = 'Model year is required';
  } else if (Number.isNaN(year) || year < 1885 || year > 2100) {
    errors.modelYear = 'Model year must be between 1885 and 2100';
  }

  if (state.priceEur !== '' && Number(state.priceEur) <= 0) {
    errors.priceEur = 'Price must be greater than zero';
  }

  if (state.additionalSpecs.length > ADDITIONAL_SPECS_MAX) {
    errors.additionalSpecs = `At most ${ADDITIONAL_SPECS_MAX} additional specifications`;
  }
  if (state.additionalSpecs.some((entry) => entry.value.trim() !== '' && entry.key.trim() === '')) {
    errors.additionalSpecs = 'Every additional specification needs a name';
  }

  return errors;
}
