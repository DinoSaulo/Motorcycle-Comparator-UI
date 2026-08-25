import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import MotorcycleCard from '../components/common/MotorcycleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useBrands, useMotorcycles } from '../hooks/useMotorcycles';
import { useLanguage } from '../hooks/useLanguage';
import {
  CATEGORIES,
  COMPARISON_MAX,
  COMPARISON_MIN,
} from '../services/motorcycleService';
import { formatCategory, formatDisplayName } from '../utils/formatters';

const PAGE_SIZE = 12;

const selectClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { brands } = useBrands();

  const SORT_OPTIONS = [
    { value: 'brand,asc', label: t('home.sortBrandAsc') },
    { value: 'priceEur,asc', label: t('home.sortPriceAsc') },
    { value: 'priceEur,desc', label: t('home.sortPriceDesc') },
    { value: 'modelYear,desc', label: t('home.sortNewest') },
  ];

  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('brand,asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);

  const filter = useMemo(() => ({ q: query, brand, category }), [query, brand, category]);
  const { motorcycles, pageInfo, loading, error, refetch } = useMotorcycles({
    filter,
    page,
    size: PAGE_SIZE,
    sort,
  });

  // Any change to what is being searched invalidates the current page number —
  // page 3 of the old result set is meaningless against the new one.
  const handleQueryChange = useCallback((next) => {
    setQuery(next);
    setPage(0);
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((m) => m.id)), [selected]);
  const isFull = selected.length >= COMPARISON_MAX;

  const toggleSelection = useCallback((motorcycle) => {
    setSelected((current) => {
      if (current.some((m) => m.id === motorcycle.id)) {
        return current.filter((m) => m.id !== motorcycle.id);
      }
      if (current.length >= COMPARISON_MAX) return current;
      return [...current, motorcycle];
    });
  }, []);

  const canCompare = selected.length >= COMPARISON_MIN;
  const hasFilters = Boolean(brand || category);

  function goToComparison() {
    navigate(`/compare?ids=${selected.map((m) => m.id).join(',')}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          {t('home.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {t('home.subtitle', { min: COMPARISON_MIN, max: COMPARISON_MAX })}
        </p>

        <div className="mx-auto mt-6 max-w-2xl">
          <SearchBar onSelect={toggleSelection} onQueryChange={handleQueryChange} />
        </div>
      </section>

      <section aria-label={t('home.filtersLabel')} className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t('home.filter')}
        </span>

        <select
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setPage(0);
          }}
          aria-label={t('home.filterByBrand')}
          className={selectClass}
        >
          <option value="">{t('home.allBrands')}</option>
          {brands.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(0);
          }}
          aria-label={t('home.filterByCategory')}
          className={selectClass}
        >
          <option value="">{t('home.allCategories')}</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {formatCategory(value, t)}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(0);
          }}
          aria-label={t('home.sortResults')}
          className={`${selectClass} ml-auto`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setBrand('');
              setCategory('');
              setPage(0);
            }}
            className="text-sm font-medium text-accent-700 hover:underline dark:text-accent-400"
          >
            {t('home.clearFilters')}
          </button>
        )}
      </section>

      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label={t('home.loadingMotorcycles')} />
        </div>
      )}

      {!loading && !error && motorcycles.length === 0 && (
        <p className="py-20 text-center text-zinc-500 dark:text-zinc-400">{t('home.noResults')}</p>
      )}

      {!loading && motorcycles.length > 0 && (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {motorcycles.map((motorcycle) => (
              <li key={motorcycle.id}>
                <MotorcycleCard
                  motorcycle={motorcycle}
                  selected={selectedIds.has(motorcycle.id)}
                  onToggle={toggleSelection}
                  disabled={isFull}
                />
              </li>
            ))}
          </ul>

          {pageInfo.totalPages > 1 && (
            <nav
              aria-label={t('home.pagination')}
              className="mt-8 flex items-center justify-center gap-4 text-sm"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageInfo.first}
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t('common.previous')}
              </button>
              <span className="numeric text-zinc-600 dark:text-zinc-400">
                {t('home.pageOf', { current: pageInfo.number + 1, total: pageInfo.totalPages })}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={pageInfo.last}
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t('common.next')}
              </button>
            </nav>
          )}
        </>
      )}

      {/* Selection tray: only appears once something is picked, and keeps the
          comparison entry point in reach while scrolling a long catalogue. */}
      {selected.length > 0 && (
        <div className="sticky bottom-4 z-20 mt-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
            <ul className="flex flex-1 flex-wrap gap-2">
              {selected.map((motorcycle) => (
                <li
                  key={motorcycle.id}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-100 py-1 pl-3 pr-1 text-sm dark:bg-zinc-800"
                >
                  <span className="max-w-40 truncate">{formatDisplayName(motorcycle)}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelection(motorcycle)}
                    aria-label={t('home.removeFromSelection', { name: formatDisplayName(motorcycle) })}
                    className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={goToComparison}
              disabled={!canCompare}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GitCompareArrows className="size-4" aria-hidden="true" />
              {canCompare
                ? t('home.compareCount', { count: selected.length })
                : t('home.selectMore', { count: COMPARISON_MIN - selected.length })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
