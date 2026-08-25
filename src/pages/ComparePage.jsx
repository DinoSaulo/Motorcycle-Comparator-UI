import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import ComparisonTable from '../components/compare/ComparisonTable';
import AddMotorcycleCard from '../components/compare/AddMotorcycleCard';
import SearchBar from '../components/search/SearchBar';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useComparison, useComparisonSelection } from '../hooks/useMotorcycles';
import { useLanguage } from '../hooks/useLanguage';
import { COMPARISON_MAX, COMPARISON_MIN } from '../services/motorcycleService';

export default function ComparePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ids, setIds } = useComparisonSelection(searchParams, setSearchParams);
  const { comparison, loading, error } = useComparison(ids);
  const [isPickerOpen, setPickerOpen] = useState(false);

  const remaining = COMPARISON_MAX - ids.length;
  const needed = COMPARISON_MIN - ids.length;

  const addMotorcycle = useCallback(
    (motorcycle) => {
      const id = String(motorcycle.id);
      if (ids.includes(id) || ids.length >= COMPARISON_MAX) return;
      setIds([...ids, id]);
      setPickerOpen(false);
    },
    [ids, setIds],
  );

  const removeMotorcycle = useCallback(
    (id) => setIds(ids.filter((current) => current !== String(id))),
    [ids, setIds],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-accent-700 dark:text-zinc-400"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('nav.backToCatalogue')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            {t('compare.title')}
          </h1>
        </div>

        {ids.length > 0 && remaining > 0 && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {t('compare.addMotorcycle')}
          </button>
        )}
      </div>

      {/* Below the endpoint's minimum there is nothing to request, so the page
          asks for more bikes instead of showing an error it caused itself. */}
      {needed > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <GitCompareArrows className="mx-auto size-10 text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            {ids.length === 0
              ? t('compare.nothingSelected')
              : t(needed === 1 ? 'compare.addMoreOne' : 'compare.addMoreMany', { count: needed })}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            {t('compare.needRange', { min: COMPARISON_MIN, max: COMPARISON_MAX })}
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <SearchBar onSelect={addMotorcycle} placeholder={t('compare.searchPlaceholder')} autoFocus />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label={t('compare.loadingComparison')} />
        </div>
      )}

      {error && <ErrorMessage error={error} />}

      {comparison && !loading && (
        <>
          <ComparisonTable comparison={comparison} onRemove={removeMotorcycle} />

          {remaining > 0 && (
            <div className="mt-6 max-w-xs">
              <AddMotorcycleCard onClick={() => setPickerOpen(true)} remaining={remaining} />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('compare.addModalTitle')}
        description={t(remaining === 1 ? 'compare.slotsLeftOne' : 'compare.slotsLeftMany', {
          count: remaining,
        })}
      >
        <SearchBar onSelect={addMotorcycle} placeholder={t('search.placeholder')} autoFocus />
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          {t('compare.typeToSeeSuggestions')}
        </p>
      </Modal>
    </div>
  );
}
