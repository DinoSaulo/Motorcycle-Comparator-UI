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

/**
 * `OFF_ROAD` → `Off Road`, or the localised label from `categories.*` when a
 * translator (`t`, from `useLanguage()`) is passed. Falls back to the naive
 * capitalisation below when no translation is available, so this stays usable
 * without a `LanguageProvider` in scope.
 */
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

/**
 * Translates a spec label or group name from the comparison endpoint — e.g. `"Model
 * year"`, `"Chassis & brakes"` — against `specLabels.*`. These are fixed English
 * strings hardcoded in the backend's `ComparisonService` (not a field name or an
 * enum, just display text it decided on), so the lookup is keyed by the exact string
 * rather than a camelCase key like `fields.*` uses for the admin form's own labels.
 *
 * Falls back to the original text when there is no matching entry — which is also
 * the correct behaviour for English (no `specLabels.*` needed there, the backend
 * string already *is* the English label) and for admin-authored "Other
 * specifications" keys, which must never be mistaken for one of these fixed labels.
 */
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
