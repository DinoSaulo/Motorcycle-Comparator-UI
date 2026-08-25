import { useId } from 'react';
import { formatCategory } from '../../utils/formatters';

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

/**
 * Renders one descriptor from `utils/motorcycleForm`.
 *
 * `value` is always a string — number inputs included — so every control stays
 * controlled and React never warns about an input flipping to uncontrolled.
 * Conversion to numbers or nulls happens once, in `toPayload`.
 */
export default function FormField({ field, value, error, onChange, disabled }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : undefined;

  const common = {
    id,
    name: field.name,
    value: value ?? '',
    disabled,
    required: field.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    onChange: (event) => onChange(field.name, event.target.value),
    className: `${inputClass} ${error ? 'border-red-500 dark:border-red-500' : ''}`,
  };

  return (
    <div className={field.full ? 'sm:col-span-2 lg:col-span-3' : undefined}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {field.label}
        {field.unit && <span className="ml-1 text-xs font-normal text-zinc-400">({field.unit})</span>}
        {field.required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {field.type === 'select' && (
        <select {...common}>
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {formatCategory(option)}
            </option>
          ))}
        </select>
      )}

      {field.type === 'textarea' && <textarea {...common} rows={3} maxLength={field.maxLength} />}

      {(field.type === 'integer' || field.type === 'decimal') && (
        <input
          {...common}
          type="number"
          inputMode={field.type === 'integer' ? 'numeric' : 'decimal'}
          // Integers step by 1 so browser spinners cannot produce 689.5 cc.
          step={field.type === 'integer' ? 1 : 'any'}
          min={field.min}
          max={field.max}
        />
      )}

      {field.type === 'text' && <input {...common} type="text" maxLength={field.maxLength} />}

      {error && (
        <p id={describedBy} className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
