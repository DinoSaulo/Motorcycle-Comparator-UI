import { formatCategory, formatDisplayName, formatEngineSize } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Listbox half of the combobox. Purely presentational: `SearchBar` owns the
 * active index and all key handling, this only renders and reports clicks.
 */
export default function AutocompleteDropdown({
  id,
  options,
  activeIndex,
  loading,
  query,
  onSelect,
  optionId,
}) {
  const hasResults = options.length > 0;

  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Motorcycle suggestions"
      className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      {loading && !hasResults && (
        <li className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500">
          <LoadingSpinner size="sm" label="Searching" />
          <span aria-hidden="true">Searching…</span>
        </li>
      )}

      {!loading && !hasResults && (
        <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
          No motorcycles match “{query}”.
        </li>
      )}

      {options.map((motorcycle, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={motorcycle.id}
            id={optionId(index)}
            role="option"
            aria-selected={isActive}
            // The input keeps DOM focus throughout, so selection has to happen on
            // mousedown — a click would land after the blur that closes the list.
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(motorcycle);
            }}
            className={[
              'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm',
              isActive ? 'bg-accent-50 dark:bg-accent-700/20' : '',
            ].join(' ')}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-zinc-900 dark:text-white">
                {formatDisplayName(motorcycle)}
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {formatCategory(motorcycle.category)} · {motorcycle.modelYear}
              </span>
            </span>
            <span className="numeric shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {formatEngineSize(motorcycle.engine?.displacementCc)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
