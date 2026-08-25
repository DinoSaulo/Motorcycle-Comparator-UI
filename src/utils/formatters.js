/**
 * Display helpers. Every one of them treats `null`/`undefined` as "not published"
 * and renders an em dash — never a zero, which would read as a real measurement.
 */

export const EMPTY_VALUE = '—';

const currency = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 });

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

/** `12995` → `€12,995` */
export function formatCurrency(value) {
  if (isBlank(value)) return EMPTY_VALUE;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? EMPTY_VALUE : currency.format(numeric);
}

/** `689` → `689 cc` */
export function formatEngineSize(displacementCc) {
  if (isBlank(displacementCc)) return EMPTY_VALUE;
  return `${decimal.format(Number(displacementCc))} cc`;
}

/** `73.4` → `73.4 hp` */
export function formatPower(maxPowerHp) {
  if (isBlank(maxPowerHp)) return EMPTY_VALUE;
  return `${decimal.format(Number(maxPowerHp))} hp`;
}

/** `68.6` → `68.6 Nm` */
export function formatTorque(maxTorqueNm) {
  if (isBlank(maxTorqueNm)) return EMPTY_VALUE;
  return `${decimal.format(Number(maxTorqueNm))} Nm`;
}

/** `189` → `189 kg` */
export function formatWeight(kg) {
  if (isBlank(kg)) return EMPTY_VALUE;
  return `${decimal.format(Number(kg))} kg`;
}

/** Generic "number plus unit", used by the comparison table where the API supplies the unit. */
export function formatMeasurement(value, unit) {
  if (isBlank(value)) return EMPTY_VALUE;
  return unit ? `${value} ${unit}` : String(value);
}

/** `OFF_ROAD` → `Off Road` */
export function formatCategory(category) {
  if (isBlank(category)) return EMPTY_VALUE;
  return category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Falls back to brand + model when the API has no explicit display name. */
export function formatDisplayName(motorcycle) {
  if (!motorcycle) return EMPTY_VALUE;
  return motorcycle.displayName || [motorcycle.brand, motorcycle.model].filter(Boolean).join(' ');
}

export function formatModelYear(modelYear) {
  return isBlank(modelYear) ? EMPTY_VALUE : String(modelYear);
}
