import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
};

/**
 * `label` is announced to screen readers; the icon itself is decorative.
 * Falls back to the translated generic "Loading" when the caller does not pass one.
 */
export default function LoadingSpinner({ size = 'md', label }) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t('common.loading');

  return (
    <div role="status" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
      <Loader2 className={`${SIZES[size]} animate-spin`} aria-hidden="true" />
      <span className="sr-only">{resolvedLabel}</span>
    </div>
  );
}
