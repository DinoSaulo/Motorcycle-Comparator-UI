import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Check, Gauge, Plus } from 'lucide-react';
import { resolveImageUrl } from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import {
  formatCategory,
  formatCurrency,
  formatDisplayName,
  formatEngineSize,
  formatPower,
} from '../../utils/formatters';

// Catalogue tile component.
// Memoised to optimize grid re-renders during selection changes.
function MotorcycleCard({ motorcycle, selected, onToggle, disabled }) {
  const { t } = useLanguage();
  const name = formatDisplayName(motorcycle);
  const imageSrc = resolveImageUrl(motorcycle.imageUrl);
  const actionLabel = t(selected ? 'compare.removeFromComparison' : 'compare.addToComparison', { name });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* The image and specs are the "view details" affordance; the toggle button below
          is a separate control, so it sits outside this link rather than nested inside it. */}
      <Link to={`/motorcycles/${motorcycle.id}`} className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset">
        <div className="relative aspect-16/10 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <Gauge className="size-12" aria-hidden="true" />
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {formatCategory(motorcycle.category, t)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 pb-0">
          <div>
            <h3 className="font-semibold leading-tight text-zinc-900 dark:text-white">{name}</h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{motorcycle.modelYear}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">{t('card.engine')}</dt>
              <dd className="numeric text-zinc-700 dark:text-zinc-300">
                {formatEngineSize(motorcycle.engine?.displacementCc)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">{t('card.power')}</dt>
              <dd className="numeric text-zinc-700 dark:text-zinc-300">
                {formatPower(motorcycle.engine?.maxPowerHp)}
              </dd>
            </div>
          </dl>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 p-4 pt-2">
        <span className="numeric font-semibold text-zinc-900 dark:text-white">
          {formatCurrency(motorcycle.priceEur)}
        </span>

        <button
          type="button"
          onClick={() => onToggle(motorcycle)}
          // A full selection must still allow de-selecting what is already in it.
          disabled={disabled && !selected}
          aria-pressed={selected}
          aria-label={actionLabel}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            selected
              ? 'bg-accent-600 text-white hover:bg-accent-700'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
          ].join(' ')}
        >
          {selected ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {selected ? t('card.selected') : t('nav.compare')}
        </button>
      </div>
    </article>
  );
}

export default memo(MotorcycleCard);
