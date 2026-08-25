import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useMotorcycles } from '../../hooks/useMotorcycles';
import AutocompleteDropdown from './AutocompleteDropdown';

const SUGGESTION_COUNT = 6;

/**
 * Free-text catalogue search with an ARIA combobox autocomplete.
 *
 * `onSelect` receives a full motorcycle when a suggestion is chosen; `onQueryChange`
 * reports the debounced term so a parent can filter its own grid alongside.
 */
export default function SearchBar({
  onSelect,
  onQueryChange,
  placeholder = 'Search by brand, model or slug…',
  autoFocus = false,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listboxId = useId();
  const optionId = (index) => `${listboxId}-option-${index}`;

  const debouncedQuery = useDebounce(query, 300);
  // The API bounds `q` at 100 characters; stop short rather than earn a 400.
  const trimmedQuery = debouncedQuery.trim().slice(0, 100);

  const { motorcycles, loading } = useMotorcycles({
    filter: { q: trimmedQuery },
    size: SUGGESTION_COUNT,
    sort: 'brand,asc',
    enabled: trimmedQuery.length > 0,
  });

  useEffect(() => {
    onQueryChange?.(trimmedQuery);
  }, [trimmedQuery, onQueryChange]);

  // A new result set invalidates whichever row was highlighted.
  useEffect(() => setActiveIndex(-1), [trimmedQuery]);

  const suggestions = trimmedQuery ? motorcycles : [];
  const showDropdown = isOpen && trimmedQuery.length > 0;

  function commit(motorcycle) {
    onSelect?.(motorcycle);
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery('');
  }

  function handleKeyDown(event) {
    if (!showDropdown) {
      if (event.key === 'ArrowDown' && trimmedQuery) setIsOpen(true);
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % Math.max(suggestions.length, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          event.preventDefault();
          commit(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  function clear() {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div
        role="combobox"
        aria-expanded={showDropdown}
        aria-owns={listboxId}
        aria-haspopup="listbox"
      >
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search motorcycles"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-12 pr-11 text-base text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-accent-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
        />

        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <AutocompleteDropdown
          id={listboxId}
          options={suggestions}
          activeIndex={activeIndex}
          loading={loading}
          query={trimmedQuery}
          onSelect={commit}
          optionId={optionId}
        />
      )}

      {/* Result counts are announced without stealing focus from the input. */}
      <span role="status" aria-live="polite" className="sr-only">
        {showDropdown && !loading
          ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available`
          : ''}
      </span>
    </div>
  );
}
