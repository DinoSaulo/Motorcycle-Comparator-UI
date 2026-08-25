import { CATEGORIES } from '../services/motorcycleService';

/**
 * Field descriptors for the admin form, declared once and rendered generically.
 *
 * Every `maxLength`, `min` and `max` here mirrors a bean-validation constraint on
 * `CreateMotorcycleRequest`. They exist to fail fast in the browser — the API still
 * validates everything, and its `violations` are what the user is ultimately shown.
 */

/**
 * `label` carries the English fallback used wherever no `t()` is in scope (e.g. the
 * validation summary below runs outside React); `labelKey` is what `FormField` renders
 * through `t()` so the field name follows the active language.
 */
export const IDENTITY_FIELDS = [
  { name: 'brand', label: 'Brand', labelKey: 'fields.brand', type: 'text', required: true, maxLength: 60 },
  { name: 'model', label: 'Model', labelKey: 'fields.model', type: 'text', required: true, maxLength: 120 },
  {
    name: 'modelYear',
    label: 'Model year',
    labelKey: 'fields.modelYear',
    type: 'integer',
    required: true,
    min: 1885,
    max: 2100,
  },
  {
    name: 'category',
    label: 'Category',
    labelKey: 'fields.category',
    type: 'select',
    required: true,
    options: CATEGORIES,
  },
  { name: 'priceEur', label: 'Price', labelKey: 'fields.priceEur', type: 'decimal', unit: 'EUR', min: 0 },
  {
    name: 'description',
    label: 'Description',
    labelKey: 'fields.description',
    type: 'textarea',
    maxLength: 2000,
    full: true,
  },
];

export const CHASSIS_FIELDS = [
  { name: 'frameType', label: 'Frame type', labelKey: 'fields.frameType', type: 'text', maxLength: 120 },
  {
    name: 'frontSuspension',
    label: 'Front suspension',
    labelKey: 'fields.frontSuspension',
    type: 'text',
    maxLength: 160,
  },
  {
    name: 'rearSuspension',
    label: 'Rear suspension',
    labelKey: 'fields.rearSuspension',
    type: 'text',
    maxLength: 160,
  },
  { name: 'frontBrake', label: 'Front brake', labelKey: 'fields.frontBrake', type: 'text', maxLength: 160 },
  { name: 'rearBrake', label: 'Rear brake', labelKey: 'fields.rearBrake', type: 'text', maxLength: 160 },
  { name: 'absType', label: 'ABS type', labelKey: 'fields.absType', type: 'text', maxLength: 80 },
  { name: 'frontTyre', label: 'Front tyre', labelKey: 'fields.frontTyre', type: 'text', maxLength: 60 },
  { name: 'rearTyre', label: 'Rear tyre', labelKey: 'fields.rearTyre', type: 'text', maxLength: 60 },
];

export const ENGINE_FIELDS = [
  { name: 'engineType', label: 'Engine type', labelKey: 'fields.engineType', type: 'text', maxLength: 80 },
  // Nullable on purpose upstream: an electric motor has no displacement.
  {
    name: 'displacementCc',
    label: 'Displacement',
    labelKey: 'fields.displacementCc',
    type: 'integer',
    unit: 'cc',
    min: 1,
  },
  { name: 'cylinders', label: 'Cylinders', labelKey: 'fields.cylinders', type: 'integer', min: 1 },
  {
    name: 'valvesPerCylinder',
    label: 'Valves per cylinder',
    labelKey: 'fields.valvesPerCylinder',
    type: 'integer',
    min: 1,
  },
  { name: 'maxPowerHp', label: 'Max power', labelKey: 'fields.maxPowerHp', type: 'decimal', unit: 'hp', min: 0 },
  {
    name: 'maxPowerRpm',
    label: 'Power peak',
    labelKey: 'fields.maxPowerRpm',
    type: 'integer',
    unit: 'rpm',
    min: 1,
  },
  {
    name: 'maxTorqueNm',
    label: 'Max torque',
    labelKey: 'fields.maxTorqueNm',
    type: 'decimal',
    unit: 'Nm',
    min: 0,
  },
  {
    name: 'maxTorqueRpm',
    label: 'Torque peak',
    labelKey: 'fields.maxTorqueRpm',
    type: 'integer',
    unit: 'rpm',
    min: 1,
  },
  {
    name: 'compressionRatio',
    label: 'Compression ratio',
    labelKey: 'fields.compressionRatio',
    type: 'text',
    maxLength: 20,
  },
  { name: 'boreMm', label: 'Bore', labelKey: 'fields.boreMm', type: 'decimal', unit: 'mm', min: 0 },
  { name: 'strokeMm', label: 'Stroke', labelKey: 'fields.strokeMm', type: 'decimal', unit: 'mm', min: 0 },
  {
    name: 'coolingSystem',
    label: 'Cooling system',
    labelKey: 'fields.coolingSystem',
    type: 'text',
    maxLength: 40,
  },
  { name: 'fuelSystem', label: 'Fuel system', labelKey: 'fields.fuelSystem', type: 'text', maxLength: 120 },
  {
    name: 'transmissionType',
    label: 'Transmission',
    labelKey: 'fields.transmissionType',
    type: 'text',
    maxLength: 60,
  },
  { name: 'gears', label: 'Gears', labelKey: 'fields.gears', type: 'integer', min: 1 },
  { name: 'finalDrive', label: 'Final drive', labelKey: 'fields.finalDrive', type: 'text', maxLength: 40 },
  {
    name: 'topSpeedKph',
    label: 'Top speed',
    labelKey: 'fields.topSpeedKph',
    type: 'integer',
    unit: 'km/h',
    min: 1,
  },
  {
    name: 'fuelConsumptionL100km',
    label: 'Fuel consumption',
    labelKey: 'fields.fuelConsumptionL100km',
    type: 'decimal',
    unit: 'l/100km',
    min: 0,
  },
  {
    name: 'emissionStandard',
    label: 'Emission standard',
    labelKey: 'fields.emissionStandard',
    type: 'text',
    maxLength: 30,
  },
];

export const DIMENSION_FIELDS = [
  { name: 'lengthMm', label: 'Length', labelKey: 'fields.lengthMm', type: 'integer', unit: 'mm', min: 1 },
  { name: 'widthMm', label: 'Width', labelKey: 'fields.widthMm', type: 'integer', unit: 'mm', min: 1 },
  { name: 'heightMm', label: 'Height', labelKey: 'fields.heightMm', type: 'integer', unit: 'mm', min: 1 },
  {
    name: 'wheelbaseMm',
    label: 'Wheelbase',
    labelKey: 'fields.wheelbaseMm',
    type: 'integer',
    unit: 'mm',
    min: 1,
  },
  {
    name: 'seatHeightMm',
    label: 'Seat height',
    labelKey: 'fields.seatHeightMm',
    type: 'integer',
    unit: 'mm',
    min: 1,
  },
  {
    name: 'groundClearanceMm',
    label: 'Ground clearance',
    labelKey: 'fields.groundClearanceMm',
    type: 'integer',
    unit: 'mm',
    min: 1,
  },
  {
    name: 'kerbWeightKg',
    label: 'Kerb weight',
    labelKey: 'fields.kerbWeightKg',
    type: 'decimal',
    unit: 'kg',
    min: 0,
  },
  {
    name: 'dryWeightKg',
    label: 'Dry weight',
    labelKey: 'fields.dryWeightKg',
    type: 'decimal',
    unit: 'kg',
    min: 0,
  },
  {
    name: 'fuelCapacityL',
    label: 'Fuel capacity',
    labelKey: 'fields.fuelCapacityL',
    type: 'decimal',
    unit: 'l',
    min: 0,
  },
  { name: 'payloadKg', label: 'Payload', labelKey: 'fields.payloadKg', type: 'decimal', unit: 'kg', min: 0 },
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

/**
 * Client-side gate for the few rules worth catching before a round trip.
 *
 * `t` is optional so this stays callable without a `LanguageProvider` in scope (tests,
 * scripts); it falls back to the English copy baked in below.
 */
export function validate(state, t = (key, vars) => FALLBACK_VALIDATION_MESSAGES[key](vars)) {
  const errors = {};
  if (!state.brand.trim()) errors.brand = t('validation.brandRequired');
  if (!state.model.trim()) errors.model = t('validation.modelRequired');
  if (!state.category) errors.category = t('validation.categoryRequired');

  const year = Number(state.modelYear);
  if (!state.modelYear) {
    errors.modelYear = t('validation.modelYearRequired');
  } else if (Number.isNaN(year) || year < 1885 || year > 2100) {
    errors.modelYear = t('validation.modelYearRange');
  }

  if (state.priceEur !== '' && Number(state.priceEur) <= 0) {
    errors.priceEur = t('validation.priceMustBePositive');
  }

  if (state.additionalSpecs.length > ADDITIONAL_SPECS_MAX) {
    errors.additionalSpecs = t('validation.tooManyAdditionalSpecs', { max: ADDITIONAL_SPECS_MAX });
  }
  if (state.additionalSpecs.some((entry) => entry.value.trim() !== '' && entry.key.trim() === '')) {
    errors.additionalSpecs = t('validation.additionalSpecNeedsName');
  }

  return errors;
}

const FALLBACK_VALIDATION_MESSAGES = {
  'validation.brandRequired': () => 'Brand is required',
  'validation.modelRequired': () => 'Model is required',
  'validation.categoryRequired': () => 'Category is required',
  'validation.modelYearRequired': () => 'Model year is required',
  'validation.modelYearRange': () => 'Model year must be between 1885 and 2100',
  'validation.priceMustBePositive': () => 'Price must be greater than zero',
  'validation.tooManyAdditionalSpecs': ({ max }) => `At most ${max} additional specifications`,
  'validation.additionalSpecNeedsName': () => 'Every additional specification needs a name',
};
