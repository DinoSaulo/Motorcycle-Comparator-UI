import { Loader2 } from 'lucide-react';

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
};

/**
 * `label` is announced to screen readers; the icon itself is decorative.
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading' }) {
  return (
    <div role="status" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
      <Loader2 className={`${SIZES[size]} animate-spin`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
