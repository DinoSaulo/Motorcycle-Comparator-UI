// Display helpers treating null/undefined as "not published" em dashes.
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

// Formats Category enums (e.g. OFF_ROAD -> Off Road) with optional i18n translation.
export function formatCategory(category, t) {
  if (isBlank(category)) return EMPTY_VALUE;

  if (t) {
    const key = `categories.${category}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }

  return category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Translates comparison spec labels and group names with fallback to original string.
export function translateSpecLabel(text, t) {
  if (isBlank(text) || !t) return text;
  const key = `specLabels.${text}`;
  const translated = t(key);
  return translated === key ? text : translated;
}

/** Falls back to brand + model when the API has no explicit display name. */
export function formatDisplayName(motorcycle) {
  if (!motorcycle) return EMPTY_VALUE;
  return motorcycle.displayName || [motorcycle.brand, motorcycle.model].filter(Boolean).join(' ');
}

export function formatModelYear(modelYear) {
  return isBlank(modelYear) ? EMPTY_VALUE : String(modelYear);
}

// Formats an integer without decimals; em dash on null/undefined.
export function formatNumber(value) {
  if (isBlank(value)) return EMPTY_VALUE;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? EMPTY_VALUE : Math.round(numeric).toString();
}

// Converts a 0–1 ratio to percentage (e.g., 0.75 → "75%"); em dash on null/undefined.
export function formatPercent(ratio) {
  if (isBlank(ratio)) return EMPTY_VALUE;
  const numeric = Number(ratio);
  if (Number.isNaN(numeric)) return EMPTY_VALUE;
  return `${Math.round(numeric * 100)}%`;
}

// Parses ISO 8601 instant to "YYYY-MM-DD at HH:MM UTC"; em dash on null/invalid.
export function formatDateTime(isoString) {
  if (isBlank(isoString)) return EMPTY_VALUE;
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} at ${hour}:${minute} UTC`;
  } catch {
    return EMPTY_VALUE;
  }
}
