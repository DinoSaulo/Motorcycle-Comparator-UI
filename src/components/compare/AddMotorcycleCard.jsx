import { Plus } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

// Accessible button for empty column slots in the comparison header.
export default function AddMotorcycleCard({ onClick, disabled, remaining }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-zinc-500 transition-colors hover:border-accent-500 hover:bg-accent-50/50 hover:text-accent-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-300 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-accent-500 dark:hover:bg-accent-700/10"
    >
      <Plus className="size-7" aria-hidden="true" />
      <span className="text-sm font-medium">{t('compare.addCardLabel')}</span>
      {remaining > 0 && (
        <span className="text-xs text-zinc-400">
          {t(remaining === 1 ? 'compare.addCardSlotsLeftOne' : 'compare.addCardSlotsLeftMany', {
            count: remaining,
          })}
        </span>
      )}
    </button>
  );
}
