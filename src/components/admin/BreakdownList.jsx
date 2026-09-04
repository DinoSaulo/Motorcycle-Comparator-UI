import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toBreakdownRows } from '../../utils/catalogStats';

// Renders breakdown (brand/category/year) sorted by count desc; top N + expand toggle.
export default function BreakdownList({ title, record, maxVisible = 10 }) {
  const [expanded, setExpanded] = useState(false);
  const rows = toBreakdownRows(record, { sort: 'desc' });

  if (rows.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No data.</p>
      </div>
    );
  }

  const visibleRows = expanded ? rows : rows.slice(0, maxVisible);
  const hasMore = rows.length > maxVisible;

  // Extract the category/type from the title for the expand button text
  const typeText = title.toLowerCase().replace('by ', '') + 's';

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <div className="mt-2 space-y-2">
        {visibleRows.map(({ key, count }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{key}</span>
            <div className="flex items-center gap-3">
              <div className="h-2 w-24 rounded bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded bg-accent-500"
                  style={{ width: `${(count / rows[0]?.count || 0) * 100}%` }}
                />
              </div>
              <span className="numeric w-12 text-right text-zinc-600 dark:text-zinc-400">
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
        >
          <ChevronDown className="size-4" aria-hidden="true" />
          Show all {rows.length} {typeText}
        </button>
      )}
    </div>
  );
}
