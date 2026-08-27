import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  ADDITIONAL_SPECS_MAX,
  ADDITIONAL_SPEC_KEY_MAX,
  ADDITIONAL_SPEC_VALUE_MAX,
} from '../../utils/motorcycleForm';

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

// Key/value editor for long-tail specs without dedicated columns.
// Kept as an ordered list so duplicate keys can briefly exist while typing.
export default function AdditionalSpecsEditor({ entries, error, onChange, disabled }) {
  const { t } = useLanguage();
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
                placeholder={t('admin.form.specNamePlaceholder')}
                maxLength={ADDITIONAL_SPEC_KEY_MAX}
                disabled={disabled}
                aria-label={t('admin.form.specNameAria', { index: index + 1 })}
                className={`${inputClass} sm:w-1/3`}
              />
              <input
                type="text"
                value={entry.value}
                onChange={(event) => update(index, { value: event.target.value })}
                placeholder={t('admin.form.specValuePlaceholder')}
                maxLength={ADDITIONAL_SPEC_VALUE_MAX}
                disabled={disabled}
                aria-label={t('admin.form.specValueAria', { index: index + 1 })}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, i) => i !== index))}
                disabled={disabled}
                aria-label={t('admin.form.removeSpecAria', { index: index + 1 })}
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
        {t('admin.form.addSpecification')}
      </button>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {t('admin.form.specsUsed', { count: entries.length, max: ADDITIONAL_SPECS_MAX })}
      </p>

      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
