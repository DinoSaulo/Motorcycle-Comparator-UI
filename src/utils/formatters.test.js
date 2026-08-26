import { describe, expect, it, vi } from 'vitest';
import {
  EMPTY_VALUE,
  formatCategory,
  formatCurrency,
  formatDisplayName,
  formatEngineSize,
  formatMeasurement,
  formatModelYear,
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
