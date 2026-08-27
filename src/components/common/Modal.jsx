import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Accessible portal dialog: focus-trapped, labelled, and Escape-dismissable.
export default function Modal({ isOpen, onClose, title, description, children }) {
  const { t } = useLanguage();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wraps tab cycle at both ends so focus stays inside the modal.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocused.current = document.activeElement;

    // Locks body scrolling while modal is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
    (focusable?.[0] ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      // Decorative backdrop for click-to-dismiss without adding a fake tab stop.
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 p-4 pt-16 backdrop-blur-sm"
      onMouseDown={(event) => {
        // mousedown, not click: a drag that starts inside the panel and ends on
        // the backdrop should not count as dismissing it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.closeDialog')}
            className="-m-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
