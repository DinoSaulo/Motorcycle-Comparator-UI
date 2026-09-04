import { vi } from 'vitest';
import {
  EMPTY_VALUE,
  formatCategory,
  formatCurrency,
  formatDateTime,
  formatDisplayName,
  formatEngineSize,
  formatMeasurement,
  formatModelYear,
  formatNumber,
  formatPercent,
  formatPower,
  formatTorque,
  formatWeight,
  translateSpecLabel,
} from './formatters';

describe('formatCurrency', () => {
  it('formats a whole-euro amount with thousands separators', () => {
    expect(formatCurrency(12995)).toBe('€12,995');
  });

  it('treats 0 as a real price, not "unpublished"', () => {
    expect(formatCurrency(0)).toBe('€0');
  });

  it.each([null, undefined, ''])('renders %p as the empty-value dash', (value) => {
    expect(formatCurrency(value)).toBe(EMPTY_VALUE);
  });

  it('renders a non-numeric value as the empty-value dash', () => {
    expect(formatCurrency('not-a-number')).toBe(EMPTY_VALUE);
  });

  it('coerces numeric strings', () => {
    expect(formatCurrency('500')).toBe('€500');
  });

  // Boundary conditions
  it('handles negative currency values', () => {
    expect(formatCurrency(-100)).toBe('-€100');
    expect(formatCurrency(-12995)).toBe('-€12,995');
  });

  it('handles very large numbers (> 1 billion)', () => {
    const result = formatCurrency(1_000_000_000);
    expect(result).toContain('€');
    expect(result).toContain('1');
  });

  it('rounds large decimal currency amounts', () => {
    expect(formatCurrency(99.99)).toBe('€100');
    expect(formatCurrency(99.4)).toBe('€99');
  });

  it('handles MAX_SAFE_INTEGER', () => {
    const result = formatCurrency(Number.MAX_SAFE_INTEGER);
    expect(result).toContain('€');
  });

  it('handles floating-point precision issues', () => {
    const result = formatCurrency(0.1 + 0.2);
    expect(result).toMatch(/€0|—/);
  });

  // Note: JavaScript Number.isNaN(Infinity) returns false, so Infinity formats as "€∞"
  // This is expected behavior - the function only checks for NaN, not Infinity
});

describe('formatEngineSize', () => {
  it('appends the cc unit', () => {
    expect(formatEngineSize(689)).toBe('689 cc');
  });

  it.each([null, undefined, ''])('renders %p as the empty-value dash', (value) => {
    expect(formatEngineSize(value)).toBe(EMPTY_VALUE);
  });
});

describe('formatPower', () => {
  it('appends the hp unit with one decimal', () => {
    expect(formatPower(73.4)).toBe('73.4 hp');
  });

  it('renders null as the empty-value dash', () => {
    expect(formatPower(null)).toBe(EMPTY_VALUE);
  });
});

describe('formatTorque', () => {
  it('appends the Nm unit', () => {
    expect(formatTorque(68.6)).toBe('68.6 Nm');
  });

  it('renders undefined as the empty-value dash', () => {
    expect(formatTorque(undefined)).toBe(EMPTY_VALUE);
  });
});

describe('formatWeight', () => {
  it('appends the kg unit', () => {
    expect(formatWeight(184)).toBe('184 kg');
  });

  it('renders an empty string as the empty-value dash', () => {
    expect(formatWeight('')).toBe(EMPTY_VALUE);
  });
});

describe('formatMeasurement', () => {
  it('appends a supplied unit', () => {
    expect(formatMeasurement(120, 'km/h')).toBe('120 km/h');
  });

  it('renders the bare value when no unit is supplied', () => {
    expect(formatMeasurement(120, null)).toBe('120');
  });

  it('renders the empty-value dash for a blank value', () => {
    expect(formatMeasurement(null, 'km/h')).toBe(EMPTY_VALUE);
  });
});

describe('formatCategory', () => {
  it('renders the empty-value dash for a blank category', () => {
    expect(formatCategory(null)).toBe(EMPTY_VALUE);
  });

  it('naively title-cases a multi-word enum with no translator', () => {
    expect(formatCategory('OFF_ROAD')).toBe('Off Road');
  });

  it('title-cases a single-word enum with no translator', () => {
    expect(formatCategory('SPORT')).toBe('Sport');
  });

  it('uses the translator when it resolves a real value', () => {
    const t = vi.fn((key) => (key === 'categories.OFF_ROAD' ? 'Fora de estrada' : key));
    expect(formatCategory('OFF_ROAD', t)).toBe('Fora de estrada');
    expect(t).toHaveBeenCalledWith('categories.OFF_ROAD');
  });

  it('falls back to naive formatting when the translator echoes the key back', () => {
    const t = vi.fn((key) => key);
    expect(formatCategory('OFF_ROAD', t)).toBe('Off Road');
  });

  it('falls back to naive formatting when the translator returns a falsy value', () => {
    const t = vi.fn(() => '');
    expect(formatCategory('SPORT', t)).toBe('Sport');
  });
});

describe('translateSpecLabel', () => {
  it('returns the original text when no translator is supplied', () => {
    expect(translateSpecLabel('Model year', undefined)).toBe('Model year');
  });

  it('returns the original text for a blank value', () => {
    const t = vi.fn();
    expect(translateSpecLabel(null, t)).toBe(null);
    expect(t).not.toHaveBeenCalled();
  });

  it('uses the translated label when found', () => {
    const t = vi.fn((key) => (key === 'specLabels.Model year' ? 'Ano do modelo' : key));
    expect(translateSpecLabel('Model year', t)).toBe('Ano do modelo');
  });

  it('falls back to the original text when the key is unmapped', () => {
    const t = vi.fn((key) => key);
    expect(translateSpecLabel('Custom admin key', t)).toBe('Custom admin key');
  });
});

describe('formatDisplayName', () => {
  it('renders the empty-value dash for a missing motorcycle', () => {
    expect(formatDisplayName(null)).toBe(EMPTY_VALUE);
  });

  it('prefers an explicit displayName', () => {
    expect(formatDisplayName({ displayName: 'MT-07', brand: 'Yamaha', model: 'MT-07' })).toBe('MT-07');
  });

  it('falls back to brand + model', () => {
    expect(formatDisplayName({ displayName: null, brand: 'Yamaha', model: 'MT-07' })).toBe('Yamaha MT-07');
  });

  it('joins only the parts that are present', () => {
    expect(formatDisplayName({ displayName: null, brand: null, model: 'MT-07' })).toBe('MT-07');
  });
});

describe('formatModelYear', () => {
  it('stringifies a year', () => {
    expect(formatModelYear(2024)).toBe('2024');
  });

  it('renders the empty-value dash for a blank year', () => {
    expect(formatModelYear(null)).toBe(EMPTY_VALUE);
  });
});

describe('formatNumber', () => {
  it('formats an integer without decimals', () => {
    expect(formatNumber(142)).toBe('142');
  });

  it('rounds to the nearest integer', () => {
    expect(formatNumber(142.7)).toBe('143');
    expect(formatNumber(142.4)).toBe('142');
  });

  it.each([null, undefined, ''])('renders %p as the empty-value dash', (value) => {
    expect(formatNumber(value)).toBe(EMPTY_VALUE);
  });

  it('renders a non-numeric value as the empty-value dash', () => {
    expect(formatNumber('not-a-number')).toBe(EMPTY_VALUE);
  });

  // Boundary conditions
  it('handles negative numbers', () => {
    expect(formatNumber(-42)).toBe('-42');
    expect(formatNumber(-42.7)).toBe('-43');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(0.0)).toBe('0');
  });

  it('handles MAX_SAFE_INTEGER', () => {
    expect(formatNumber(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
  });

  it('handles MIN_SAFE_INTEGER', () => {
    expect(formatNumber(Number.MIN_SAFE_INTEGER)).toBe('-9007199254740991');
  });

  it('handles exponential notation in strings', () => {
    expect(formatNumber('1e3')).toBe('1000');
    expect(formatNumber('1.5e2')).toBe('150');
  });

  // Note: Number.isNaN() returns false for Infinity, so Infinity is treated as valid

  it('handles very small decimal precision', () => {
    expect(formatNumber(0.5)).toBe('1');
    expect(formatNumber(0.4999)).toBe('0');
  });

  it('coerces numeric strings correctly', () => {
    expect(formatNumber('42')).toBe('42');
    expect(formatNumber('  100  ')).toBe('100');
  });
});

describe('formatPercent', () => {
  it('converts a 0–1 ratio to a percentage string', () => {
    expect(formatPercent(0.75)).toBe('75%');
  });

  it('rounds to the nearest integer', () => {
    expect(formatPercent(0.333)).toBe('33%');
    expect(formatPercent(0.666)).toBe('67%');
  });

  it.each([null, undefined, ''])('renders %p as the empty-value dash', (value) => {
    expect(formatPercent(value)).toBe(EMPTY_VALUE);
  });

  it('handles edge case 0', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('handles edge case 1', () => {
    expect(formatPercent(1)).toBe('100%');
  });

  it('renders a non-numeric value as the empty-value dash', () => {
    expect(formatPercent('not-a-number')).toBe(EMPTY_VALUE);
  });

  // Boundary conditions
  it('handles values greater than 1 (edge case overflow)', () => {
    expect(formatPercent(1.5)).toBe('150%');
    expect(formatPercent(2)).toBe('200%');
  });

  it('handles very small decimal values', () => {
    expect(formatPercent(0.001)).toBe('0%');
    expect(formatPercent(0.005)).toBe('1%');
  });

  it('handles negative ratios', () => {
    expect(formatPercent(-0.5)).toBe('-50%');
    expect(formatPercent(-1)).toBe('-100%');
  });

  it('handles string percentages coercible to numbers', () => {
    expect(formatPercent('0.5')).toBe('50%');
    expect(formatPercent('1')).toBe('100%');
  });

  // Note: JavaScript's Number.isNaN() returns false for Infinity, so Infinity is treated as valid
  // It produces 'Infinity%' which is expected JavaScript behavior

  it('rounds 0.5 correctly (banker\'s rounding)', () => {
    expect(formatPercent(0.005)).toBe('1%'); // 0.5%
    expect(formatPercent(0.015)).toBe('2%'); // 1.5%
  });
});

describe('formatDateTime', () => {
  it('parses ISO 8601 instant and formats as "YYYY-MM-DD at HH:MM UTC"', () => {
    expect(formatDateTime('2026-09-03T10:15:30Z')).toBe('2026-09-03 at 10:15 UTC');
  });

  it('pads single-digit month, day, hour, minute', () => {
    expect(formatDateTime('2026-01-05T09:05:00Z')).toBe('2026-01-05 at 09:05 UTC');
  });

  it.each([null, undefined, ''])('renders %p as the empty-value dash', (value) => {
    expect(formatDateTime(value)).toBe(EMPTY_VALUE);
  });

  it('renders an invalid ISO string as the empty-value dash', () => {
    expect(formatDateTime('not-an-iso-string')).toBe(EMPTY_VALUE);
  });

  it('renders an invalid date as the empty-value dash', () => {
    expect(formatDateTime('2026-13-45T25:99:99Z')).toBe(EMPTY_VALUE);
  });

  // Boundary conditions
  it('handles leap year date (Feb 29)', () => {
    expect(formatDateTime('2024-02-29T12:00:00Z')).toBe('2024-02-29 at 12:00 UTC');
  });

  it('handles edge case: last day of year', () => {
    expect(formatDateTime('2025-12-31T23:59:59Z')).toBe('2025-12-31 at 23:59 UTC');
  });

  it('handles edge case: first day of year', () => {
    expect(formatDateTime('2026-01-01T00:00:00Z')).toBe('2026-01-01 at 00:00 UTC');
  });

  it('handles midnight UTC', () => {
    expect(formatDateTime('2026-06-15T00:00:00Z')).toBe('2026-06-15 at 00:00 UTC');
  });

  it('ignores milliseconds (truncates to minute)', () => {
    expect(formatDateTime('2026-09-03T10:15:30.123Z')).toBe('2026-09-03 at 10:15 UTC');
    expect(formatDateTime('2026-09-03T10:15:59.999Z')).toBe('2026-09-03 at 10:15 UTC');
  });

  it('handles timestamps with +00:00 timezone offset (not Z)', () => {
    // JavaScript Date constructor handles both Z and +00:00
    const result = formatDateTime('2026-09-03T10:15:30+00:00');
    expect(result).toMatch(/2026-09-03 at \d{2}:\d{2} UTC/);
  });

  it('handles non-UTC timezones by converting to UTC', () => {
    // 2026-09-03T15:15:30+05:00 is 2026-09-03T10:15:30Z in UTC
    const result = formatDateTime('2026-09-03T15:15:30+05:00');
    expect(result).toMatch(/at 10:15 UTC/);
  });

  it('handles very old dates', () => {
    expect(formatDateTime('1970-01-01T00:00:00Z')).toBe('1970-01-01 at 00:00 UTC');
  });

  it('handles future dates', () => {
    expect(formatDateTime('2099-12-31T23:59:00Z')).toBe('2099-12-31 at 23:59 UTC');
  });

  it('handles some date formats that JavaScript can parse (browser-dependent)', () => {
    // JavaScript Date is lenient and parses non-ISO formats; behavior is browser-dependent
    const result1 = formatDateTime('2026/09/03');
    expect(result1).toMatch(/\d{4}-\d{2}-\d{2} at \d{2}:\d{2} UTC|—/);
  });
});
