import { RotateCcw, TriangleAlert } from 'lucide-react';

/**
 * Renders an `ApiRequestError`. Field violations from a 400 are listed individually
 * so the user learns which input the API rejected, not just that something failed.
 */
export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;

  const violations = error.violations ?? [];

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30"
    >
      <div className="flex gap-3">
        <TriangleAlert className="size-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-900 dark:text-red-200">{error.message}</p>

          {violations.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-red-800 dark:text-red-300">
              {violations.map((violation) => (
                <li key={`${violation.field}-${violation.message}`}>
                  <span className="font-medium">{violation.field}</span>: {violation.message}
                </li>
              ))}
            </ul>
          )}

          {onRetry && error.isRetryable !== false && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
