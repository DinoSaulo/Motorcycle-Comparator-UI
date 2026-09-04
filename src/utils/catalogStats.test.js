import { completenessRatio, toBreakdownRows } from './catalogStats';

describe('completenessRatio', () => {
  it('calculates (total - gaps) / total when total > 0', () => {
    expect(completenessRatio(100, 25)).toBe(0.75);
  });

  it('returns null when total is 0 (prevent division by zero)', () => {
    expect(completenessRatio(0, 0)).toBeNull();
  });

  it('returns null when total is null', () => {
    expect(completenessRatio(null, 5)).toBeNull();
  });

  it('returns null when total is undefined', () => {
    expect(completenessRatio(undefined, 5)).toBeNull();
  });

  it('handles negative gaps (edge case: gaps > total)', () => {
    // If the API ever reports gaps > total (shouldn't), we still don't crash.
    expect(completenessRatio(10, 15)).toBe(-0.5);
  });

  // Edge cases: boundary conditions
  it('returns 1.0 when gaps is 0 (perfect completeness)', () => {
    expect(completenessRatio(100, 0)).toBe(1.0);
  });

  it('returns 0.0 when total equals gaps', () => {
    expect(completenessRatio(50, 50)).toBe(0.0);
  });

  it('handles very large numbers (approaching MAX_SAFE_INTEGER)', () => {
    const largeNum = Math.floor(Number.MAX_SAFE_INTEGER / 2);
    const ratio = completenessRatio(largeNum, largeNum / 2);
    expect(ratio).toBeCloseTo(0.5, 10);
  });

  it('handles small decimal values', () => {
    const ratio = completenessRatio(1, 0.5);
    expect(ratio).toBeCloseTo(0.5, 10);
  });

  it('handles floating-point precision correctly', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
    const ratio = completenessRatio(0.3, 0.1);
    expect(ratio).toBeCloseTo(0.6666, 3);
  });

  it('handles single-unit completeness', () => {
    expect(completenessRatio(1, 0)).toBe(1.0);
    expect(completenessRatio(1, 1)).toBe(0.0);
  });
});

describe('toBreakdownRows', () => {
  it('converts a record to sorted array of { key, count }', () => {
    const record = { Yamaha: 12, Honda: 9, BMW: 15 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows).toEqual([
      { key: 'BMW', count: 15 },
      { key: 'Yamaha', count: 12 },
      { key: 'Honda', count: 9 },
    ]);
  });

  it('sorts ascending when sort is asc', () => {
    const record = { A: 5, B: 10 };
    const rows = toBreakdownRows(record, { sort: 'asc' });
    expect(rows).toEqual([
      { key: 'A', count: 5 },
      { key: 'B', count: 10 },
    ]);
  });

  it('sorts alphabetically when counts are equal', () => {
    const record = { Zebra: 5, Apple: 5 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('Apple'); // alphabetical tiebreaker
  });

  it('returns empty array for empty object', () => {
    expect(toBreakdownRows({}, { sort: 'desc' })).toEqual([]);
  });

  // Edge cases: null/undefined/invalid inputs
  it('returns empty array when record is null', () => {
    expect(toBreakdownRows(null, { sort: 'desc' })).toEqual([]);
  });

  it('returns empty array when record is undefined', () => {
    expect(toBreakdownRows(undefined, { sort: 'desc' })).toEqual([]);
  });

  it('returns empty array when record is not an object', () => {
    expect(toBreakdownRows('string', { sort: 'desc' })).toEqual([]);
    expect(toBreakdownRows(42, { sort: 'desc' })).toEqual([]);
    expect(toBreakdownRows(true, { sort: 'desc' })).toEqual([]);
  });

  // Edge cases: boundary conditions
  it('handles record with single entry', () => {
    const record = { OnlyBrand: 42 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows).toEqual([{ key: 'OnlyBrand', count: 42 }]);
  });

  it('handles records with zero counts', () => {
    const record = { Yamaha: 10, Honda: 0, BMW: 5 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('Yamaha');
    expect(rows[1].key).toBe('BMW');
    expect(rows[2]).toEqual({ key: 'Honda', count: 0 });
  });

  it('sorts alphabetically when all counts are equal', () => {
    const record = { Zebra: 5, Apple: 5, Charlie: 5 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows.map((r) => r.key)).toEqual(['Apple', 'Charlie', 'Zebra']);
  });

  it('handles special characters in keys', () => {
    const record = { 'BMW-Motorrad': 10, 'Harley-Davidson': 8 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('BMW-Motorrad');
    expect(rows[1].key).toBe('Harley-Davidson');
  });

  it('handles empty string keys', () => {
    const record = { '': 5, A: 10 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('A');
    expect(rows[1].key).toBe('');
  });

  it('handles numeric string keys', () => {
    const record = { '2024': 40, '2023': 30, '2022': 20 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows.map((r) => r.key)).toEqual(['2024', '2023', '2022']);
  });

  it('handles very large counts', () => {
    const record = { A: 1_000_000, B: 500_000 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].count).toBe(1_000_000);
    expect(rows[1].count).toBe(500_000);
  });

  it('defaults sort to desc when not specified', () => {
    const record = { A: 5, B: 10 };
    const rows = toBreakdownRows(record, {});
    expect(rows[0].key).toBe('B');
    expect(rows[1].key).toBe('A');
  });

  it('handles negative counts (edge case)', () => {
    const record = { A: -5, B: 10 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('B');
    expect(rows[1].key).toBe('A');
  });

  it('handles decimal counts', () => {
    const record = { A: 10.5, B: 5.3 };
    const rows = toBreakdownRows(record, { sort: 'desc' });
    expect(rows[0].key).toBe('A');
    expect(rows[1].key).toBe('B');
  });
});
