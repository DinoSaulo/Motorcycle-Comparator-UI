import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Gauge, GitCompareArrows } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { resolveImageUrl } from '../services/api';
import { getMotorcycleById } from '../services/motorcycleService';
import { useLanguage } from '../hooks/useLanguage';
import {
  CHASSIS_FIELDS,
  DIMENSION_FIELDS,
  ENGINE_FIELDS,
} from '../utils/motorcycleForm';
import {
  EMPTY_VALUE,
  formatCategory,
  formatCurrency,
  formatDisplayName,
  formatMeasurement,
  translateSpecLabel,
} from '../utils/formatters';

/** `null`/`undefined`/`""` all mean "not published" — see CLAUDE.md §3. */
function isBlank(value) {
  return value === null || value === undefined || value === '';
}

/**
 * Builds the rows for one field group, dropping anything that was never published.
 * A group with nothing left to show is omitted entirely rather than rendered as a
 * wall of em dashes.
 */
function buildRows(fields, source) {
  return fields
    .map((field) => ({ field, value: source?.[field.name] }))
    .filter(({ value }) => !isBlank(value));
}

function SpecSection({ title, rows }) {
  const { t } = useLanguage();
  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(({ field, value }) => (
          <div key={field.name} className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t(field.labelKey)}</dt>
            <dd className="numeric text-right text-sm font-medium text-zinc-900 dark:text-white">
              {formatMeasurement(value, field.unit)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Renders a back button that either goes back in history (if coming from the catalogue with filters)
 * or navigates to home (fallback).
 */
function BackButton({ t }) {
  const handleBackClick = () => {
    // Try to go back in history; if there's no history, fall back to home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <button
      type="button"
      onClick={handleBackClick}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-accent-700 dark:text-zinc-400"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t('nav.backToCatalogue')}
    </button>
  );
}

export default function MotorcycleDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const location = useLocation();
  const [motorcycle, setMotorcycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getMotorcycleById(id, { signal: controller.signal })
      .then((data) => {
        setMotorcycle(data);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label={t('motorcycleDetail.loading')} />
      </div>
    );
  }

  if (error || !motorcycle) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        {error && <ErrorMessage error={error} />}
        <BackButton t={t} />
      </div>
    );
  }

  const name = formatDisplayName(motorcycle);
  const imageSrc = resolveImageUrl(motorcycle.imageUrl);

  const chassisRows = buildRows(CHASSIS_FIELDS, motorcycle);
  const engineRows = buildRows(ENGINE_FIELDS, motorcycle.engine);
  const dimensionRows = buildRows(DIMENSION_FIELDS, motorcycle.dimension);
  const additionalSpecs = Object.entries(motorcycle.additionalSpecs ?? {}).filter(
    ([, value]) => !isBlank(value),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <BackButton t={t} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="aspect-16/10 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {imageSrc ? (
              <img src={imageSrc} alt={name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                <Gauge className="size-16" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <span className="inline-block rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100/10">
            {formatCategory(motorcycle.category, t)}
          </span>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {name}
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">{motorcycle.modelYear}</p>

          <p className="numeric mt-4 text-2xl font-semibold text-accent-700 dark:text-accent-400">
            {formatCurrency(motorcycle.priceEur)}
          </p>

          {motorcycle.description && (
            <p className="mt-4 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {motorcycle.description}
            </p>
          )}

          <Link
            to={`/compare?ids=${motorcycle.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
          >
            <GitCompareArrows className="size-4" aria-hidden="true" />
            {t('motorcycleDetail.startComparison')}
          </Link>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <SpecSection title={translateSpecLabel('Engine', t)} rows={engineRows} />
        <SpecSection title={translateSpecLabel('Chassis & brakes', t)} rows={chassisRows} />
        <SpecSection title={translateSpecLabel('Dimensions & weight', t)} rows={dimensionRows} />

        {additionalSpecs.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {translateSpecLabel('Other specifications', t)}
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {additionalSpecs.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800"
                >
                  <dt className="text-sm text-zinc-500 dark:text-zinc-400">{key}</dt>
                  <dd className="text-right text-sm font-medium text-zinc-900 dark:text-white">
                    {isBlank(value) ? EMPTY_VALUE : value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
