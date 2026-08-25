import { Plus, Trash2 } from 'lucide-react';
import {
  ADDITIONAL_SPECS_MAX,
  ADDITIONAL_SPEC_KEY_MAX,
  ADDITIONAL_SPEC_VALUE_MAX,
} from '../../utils/motorcycleForm';

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

/**
 * Key/value editor for the long-tail specs that have no dedicated column.
 *
 * Rows are kept as an ordered list rather than an object so two of them can briefly hold
 * the same key while being typed; `toPayload` collapses them into a map on submit.
 */
export default function AdditionalSpecsEditor({ entries, error, onChange, disabled }) {
  const update = (index, patch) =>
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));

  return (
    <div>
      {entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((entry, index) => (
            // Index-keyed on purpose: rows have no stable identity, and the key may be
            // empty or duplicated mid-edit.
            <li key={index} className="flex gap-2">
              <input
                type="text"
                value={entry.key}
                onChange={(event) => update(index, { key: event.target.value })}
                placeholder="Name, e.g. Rider modes"
                maxLength={ADDITIONAL_SPEC_KEY_MAX}
                disabled={disabled}
                aria-label={`Specification ${index + 1} name`}
                className={`${inputClass} sm:w-1/3`}
              />
              <input
                type="text"
                value={entry.value}
                onChange={(event) => update(index, { value: event.target.value })}
                placeholder="Value, e.g. 4 (Sport, Road, Rain, Rider)"
                maxLength={ADDITIONAL_SPEC_VALUE_MAX}
                disabled={disabled}
                aria-label={`Specification ${index + 1} value`}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, i) => i !== index))}
                disabled={disabled}
                aria-label={`Remove specification ${index + 1}`}
                className="shrink-0 rounded-lg px-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onChange([...entries, { key: '', value: '' }])}
        disabled={disabled || entries.length >= ADDITIONAL_SPECS_MAX}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add specification
      </button>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {entries.length} of {ADDITIONAL_SPECS_MAX} used.
      </p>

      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
