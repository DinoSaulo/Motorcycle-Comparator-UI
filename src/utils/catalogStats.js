// Calculates (total - gaps) / total; returns null when total is 0 (divide-by-zero guard).
export function completenessRatio(total, gapCount) {
  if (total === null || total === undefined || total === 0) {
    return null;
  }
  return (total - gapCount) / total;
}

// Converts { key: count } to sorted [{ key, count }] by count (desc/asc) then alphabetically.
export function toBreakdownRows(record, { sort = 'desc' } = {}) {
  if (!record || typeof record !== 'object') return [];

  const rows = Object.entries(record).map(([key, count]) => ({ key, count }));

  rows.sort((a, b) => {
    const countCmp = sort === 'desc' ? b.count - a.count : a.count - b.count;
    if (countCmp !== 0) return countCmp;
    return a.key.localeCompare(b.key);
  });

  return rows;
}
