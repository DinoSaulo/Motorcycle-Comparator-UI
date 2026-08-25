import { memo } from 'react';
import { Trophy } from 'lucide-react';
import { EMPTY_VALUE } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * One specification line across every compared motorcycle.
 *
 * The row arrives fully resolved from the API — label, unit, display order and
 * `winnerIndexes` are all decided server-side — so this stays a dumb renderer.
 *
 * Two contract details matter here:
 *  - a `null` value means "not published" and must render as a dash, never as 0;
 *  - `winnerIndexes` is empty when the spec is not rankable or everything ties.
 */
function SpecRow({ row, columnCount }) {
  const { t } = useLanguage();
  const winners = new Set(row.winnerIndexes ?? []);
  // Highlighting every column when they all tie is just noise.
  const showWinners = winners.size > 0 && winners.size < columnCount;

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {row.label}
        {row.unit && <span className="ml-1 text-xs text-zinc-400">({row.unit})</span>}
      </th>

      {Array.from({ length: columnCount }, (_, index) => {
        const value = row.values?.[index];
        const isMissing = value === null || value === undefined || value === '';
        const isWinner = showWinners && winners.has(index);

        return (
          <td
            key={index}
            className={[
              'numeric px-4 py-3 text-sm',
              isWinner
                ? 'bg-accent-50/70 font-semibold text-accent-700 dark:bg-accent-700/15 dark:text-accent-300'
                : 'text-zinc-800 dark:text-zinc-200',
              isMissing ? 'text-zinc-400 dark:text-zinc-600' : '',
            ].join(' ')}
          >
            <span className="flex items-center gap-1.5">
              {isMissing ? EMPTY_VALUE : value}
              {isWinner && (
                <>
                  <Trophy className="size-3.5 shrink-0" aria-hidden="true" />
                  {/* Colour alone must not carry the meaning. */}
                  <span className="sr-only">{t('common.bestValue')}</span>
                </>
              )}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

export default memo(SpecRow);
