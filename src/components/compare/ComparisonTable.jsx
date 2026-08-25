import { useMemo, useState } from 'react';
import { Gauge, X } from 'lucide-react';
import SpecRow from './SpecRow';
import { resolveImageUrl } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCategory, formatCurrency, formatDisplayName } from '../../utils/formatters';

/**
 * Renders the comparison exactly as the API shaped it: groups in order, rows in order.
 * `group.name`, `row.label` and `row.unit` come straight from the backend and are not
 * translated client-side — the comparison endpoint owns them.
 *
 * The only client-side transformation is the "differences only" filter, which leans on
 * the `differing` flag the backend already computes per row.
 */
export default function ComparisonTable({ comparison, onRemove }) {
  const { t } = useLanguage();
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const { motorcycles, groups } = comparison;
  const columnCount = motorcycles.length;

  const visibleGroups = useMemo(() => {
    if (!differencesOnly) return groups;
    // Groups that end up empty are dropped so the table has no orphan headings.
    return groups
      .map((group) => ({ ...group, rows: group.rows.filter((row) => row.differing) }))
      .filter((group) => group.rows.length > 0);
  }, [groups, differencesOnly]);

  const identicalCount = useMemo(
    () => groups.reduce((total, group) => total + group.rows.filter((r) => !r.differing).length, 0),
    [groups],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('compare.comparingPrefix')} <span className="font-medium">{columnCount}</span>{' '}
          {t('compare.comparingSuffix')}
          {identicalCount > 0 && ` · ${t('compare.identicalSpecs', { count: identicalCount })}`}
        </p>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={differencesOnly}
            onChange={(event) => setDifferencesOnly(event.target.checked)}
            className="size-4 rounded border-zinc-300 text-accent-600 focus:ring-accent-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          {t('compare.showDifferencesOnly')}
        </label>
      </div>

      {/* Horizontal scrolling is contained here so the page body never scrolls sideways. */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-3xl border-collapse text-left">
          <caption className="sr-only">{t('compare.tableCaption', { count: columnCount })}</caption>

          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 w-56 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/80"
              >
                {t('compare.specificationHeader')}
              </th>

              {motorcycles.map((motorcycle) => (
                <th
                  key={motorcycle.id}
                  scope="col"
                  className="min-w-52 bg-zinc-50 p-4 align-top dark:bg-zinc-800/80"
                >
                  <div className="flex flex-col gap-2">
                    <div className="aspect-16/10 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
                      {resolveImageUrl(motorcycle.imageUrl) ? (
                        <img
                          src={resolveImageUrl(motorcycle.imageUrl)}
                          alt={formatDisplayName(motorcycle)}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-zinc-400">
                          <Gauge className="size-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {formatDisplayName(motorcycle)}
                        </span>
                        <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          {formatCategory(motorcycle.category, t)} · {motorcycle.modelYear}
                        </span>
                        <span className="numeric mt-1 block text-sm font-semibold text-accent-700 dark:text-accent-400">
                          {formatCurrency(motorcycle.priceEur)}
                        </span>
                      </div>

                      {onRemove && (
                        <button
                          type="button"
                          onClick={() => onRemove(motorcycle.id)}
                          aria-label={t('compare.removeFromComparison', { name: formatDisplayName(motorcycle) })}
                          className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {visibleGroups.map((group) => (
            <tbody key={group.name}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={columnCount + 1}
                  className="bg-zinc-100 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {group.name}
                </th>
              </tr>

              {group.rows.map((row) => (
                <SpecRow key={`${group.name}-${row.label}`} row={row} columnCount={columnCount} />
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {differencesOnly && visibleGroups.length === 0 && (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t('compare.identicalNotice')}
        </p>
      )}
    </div>
  );
}
