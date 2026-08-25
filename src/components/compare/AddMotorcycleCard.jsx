import { Plus } from 'lucide-react';

/**
 * Empty column slot in the comparison header. Renders as a button so it is
 * reachable by keyboard and announced as an action, not decoration.
 */
export default function AddMotorcycleCard({ onClick, disabled, remaining }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-zinc-500 transition-colors hover:border-accent-500 hover:bg-accent-50/50 hover:text-accent-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-300 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-accent-500 dark:hover:bg-accent-700/10"
    >
      <Plus className="size-7" aria-hidden="true" />
      <span className="text-sm font-medium">Add motorcycle</span>
      {remaining > 0 && (
        <span className="text-xs text-zinc-400">
          {remaining} slot{remaining === 1 ? '' : 's'} left
        </span>
      )}
    </button>
  );
}
