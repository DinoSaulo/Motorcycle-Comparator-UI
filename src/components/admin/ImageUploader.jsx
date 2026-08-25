import { useEffect, useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../../services/api';
import { IMAGE_CONTENT_TYPES, IMAGE_MAX_BYTES } from '../../services/motorcycleService';
import { useLanguage } from '../../hooks/useLanguage';
import LoadingSpinner from '../common/LoadingSpinner';

function describeSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Picks an image and previews it.
 *
 * Two modes, because the API needs an id before it can accept a file:
 *  - **deferred** (`onFileSelected`): the file is held locally and previewed from an object
 *    URL; the create page uploads it right after the motorcycle exists.
 *  - **immediate** (`onUpload`): the file is sent straight away, used when editing.
 *
 * Type and size are checked here so the obvious mistakes never cost a round trip. The API
 * re-checks both, and additionally verifies the bytes match the declared type — which this
 * cannot do, so a renamed file still fails server-side with a clear message.
 */
export default function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
  onFileSelected,
  disabled,
  busy,
}) {
  const { t } = useLanguage();
  const extensions = t('admin.form.imageFormats');
  const [localError, setLocalError] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // Object URLs are leaked memory until revoked, so each one is released when it is
  // replaced or the component unmounts.
  useEffect(() => () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
  }, [pendingPreview]);

  function accept(file) {
    if (!file) return;
    setLocalError(null);

    if (!IMAGE_CONTENT_TYPES.includes(file.type)) {
      setLocalError(t('admin.form.unsupportedType', { formats: extensions }));
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setLocalError(
        t('admin.form.tooLarge', {
          size: describeSize(file.size),
          limit: describeSize(IMAGE_MAX_BYTES),
        }),
      );
      return;
    }

    if (onUpload) {
      onUpload(file);
      return;
    }

    setPendingPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onFileSelected?.(file);
  }

  function clear() {
    setLocalError(null);
    if (pendingPreview) {
      URL.revokeObjectURL(pendingPreview);
      setPendingPreview(null);
      onFileSelected?.(null);
      return;
    }
    onRemove?.();
  }

  const preview = pendingPreview ?? resolveImageUrl(imageUrl);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t('admin.form.imageLabel')}
      </span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) accept(event.dataTransfer.files?.[0]);
        }}
        className={[
          'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-5 transition-colors',
          dragging
            ? 'border-accent-500 bg-accent-50/60 dark:bg-accent-700/10'
            : 'border-zinc-300 dark:border-zinc-700',
        ].join(' ')}
      >
        {preview ? (
          <img
            src={preview}
            alt={t('admin.form.selectedMotorcycleAlt')}
            className="max-h-44 w-full rounded-lg object-contain"
          />
        ) : (
          <div className="flex flex-col items-center py-4 text-zinc-400">
            <ImageUp className="size-9" aria-hidden="true" />
            <p className="mt-2 text-sm">{t('admin.form.dragHint')}</p>
            <p className="text-xs">
              {t('admin.form.upToSize', { formats: extensions, size: describeSize(IMAGE_MAX_BYTES) })}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_CONTENT_TYPES.join(',')}
          className="sr-only"
          disabled={disabled || busy}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            // Reset so picking the same file twice still fires a change event.
            event.target.value = '';
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {preview ? t('admin.form.replaceImage') : t('admin.form.chooseImage')}
          </button>

          {preview && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('admin.form.remove')}
            </button>
          )}

          {busy && <LoadingSpinner size="sm" label={t('admin.form.uploadingImage')} />}
        </div>
      </div>

      {localError && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {localError}
        </p>
      )}

      {pendingPreview && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {t('admin.form.pendingUploadNotice')}
        </p>
      )}
    </div>
  );
}
