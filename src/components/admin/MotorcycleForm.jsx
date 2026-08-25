import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import FormField from './FormField';
import AdditionalSpecsEditor from './AdditionalSpecsEditor';
import ImageUploader from './ImageUploader';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  CHASSIS_FIELDS,
  DIMENSION_FIELDS,
  ENGINE_FIELDS,
  IDENTITY_FIELDS,
  toPayload,
  validate,
} from '../../utils/motorcycleForm';

function Section({ title, description, children }) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </legend>
      {description && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {children}
    </fieldset>
  );
}

const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

/**
 * Create/edit form for a motorcycle.
 *
 * The parent owns `state` so it can also drive the image endpoints, which live outside the
 * JSON payload. Server-side field violations are merged into the same error map as the local
 * checks, so both render against their own input.
 */
export default function MotorcycleForm({
  state,
  onChange,
  onSubmit,
  onImageUpload,
  onImageRemove,
  onImageSelected,
  submitting,
  imageBusy,
  error,
  submitLabel,
}) {
  const [errors, setErrors] = useState({});
  const focusOnNextRender = useRef(false);

  // The focus target only gains aria-invalid once React has re-rendered with the new
  // errors, so it cannot be looked up inside the submit handler itself.
  useEffect(() => {
    if (!focusOnNextRender.current) return;
    focusOnNextRender.current = false;
    document.querySelector('[aria-invalid="true"]')?.focus();
  }, [errors]);

  // A 400 names the offending field as `engine.gears` or `brand`; the leaf is what
  // identifies the input on screen.
  const violationErrors = Object.fromEntries(
    (error?.violations ?? []).map((violation) => [violation.field.split('.').pop(), violation.message]),
  );
  const allErrors = { ...violationErrors, ...errors };

  function setField(name, value) {
    onChange({ ...state, [name]: value });
  }

  function setBlockField(block) {
    return (name, value) => onChange({ ...state, [block]: { ...state[block], [name]: value } });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate(state);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Take the user to the first problem rather than leaving them to hunt for it
      // in a form this long.
      focusOnNextRender.current = true;
      return;
    }
    onSubmit(toPayload(state));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && <ErrorMessage error={error} />}

      <Section title="Identity">
        <div className={grid}>
          {IDENTITY_FIELDS.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={state[field.name]}
              error={allErrors[field.name]}
              onChange={setField}
              disabled={submitting}
            />
          ))}
        </div>

        <div className="mt-5 max-w-md">
          <ImageUploader
            imageUrl={state.imageUrl}
            onUpload={onImageUpload}
            onRemove={onImageRemove}
            onFileSelected={onImageSelected}
            busy={imageBusy}
            disabled={submitting}
          />
        </div>
      </Section>

      <Section title="Engine" description="Every field is optional; leave a measurement blank when it is not published.">
        <div className={grid}>
          {ENGINE_FIELDS.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={state.engine[field.name]}
              error={allErrors[field.name]}
              onChange={setBlockField('engine')}
              disabled={submitting}
            />
          ))}
        </div>
      </Section>

      <Section title="Chassis & brakes">
        <div className={grid}>
          {CHASSIS_FIELDS.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={state[field.name]}
              error={allErrors[field.name]}
              onChange={setField}
              disabled={submitting}
            />
          ))}
        </div>
      </Section>

      <Section title="Dimensions & weight" description="Leaving this block entirely blank clears any dimensions already stored.">
        <div className={grid}>
          {DIMENSION_FIELDS.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={state.dimension[field.name]}
              error={allErrors[field.name]}
              onChange={setBlockField('dimension')}
              disabled={submitting}
            />
          ))}
        </div>
      </Section>

      <Section title="Additional specifications">
        <AdditionalSpecsEditor
          entries={state.additionalSpecs}
          error={allErrors.additionalSpecs}
          onChange={(entries) => onChange({ ...state, additionalSpecs: entries })}
          disabled={submitting}
        />
      </Section>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50/95 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <LoadingSpinner size="sm" label="Saving" /> : <Save className="size-4" aria-hidden="true" />}
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
