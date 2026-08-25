import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import MotorcycleForm from '../components/admin/MotorcycleForm';
import LoginForm from '../components/admin/LoginForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import {
  createMotorcycle,
  deleteMotorcycleImage,
  getMotorcycleById,
  updateMotorcycle,
  uploadMotorcycleImage,
} from '../services/motorcycleService';
import { emptyFormState, toFormState } from '../utils/motorcycleForm';

export default function AdminMotorcycleFormPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { id } = useParams();
  const isEditing = Boolean(id);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoginForm />
      </div>
    );
  }

  return <FormScreen id={id} isEditing={isEditing} />;
}

function FormScreen({ id, isEditing }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [state, setState] = useState(emptyFormState);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  // A create whose image upload failed redirects here and hands over the reason, so the
  // admin lands on the saved record already knowing only the image needs another try.
  const [error, setError] = useState(
    location.state?.imageError
      ? { message: t('admin.form.imageUploadFailed', { reason: location.state.imageError }) }
      : null,
  );
  // Held until the motorcycle exists: the upload endpoint is addressed by id.
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => {
    if (!isEditing) return undefined;

    const controller = new AbortController();
    setLoading(true);

    getMotorcycleById(id, { signal: controller.signal })
      .then((motorcycle) => {
        setState(toFormState(motorcycle));
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, isEditing]);

  const uploadNow = useCallback(
    async (file) => {
      setImageBusy(true);
      setError(null);
      try {
        const updated = await uploadMotorcycleImage(id, file);
        // Adopt the URL the API just issued. PUT is a full replacement, so a stale
        // imageUrl in form state would undo this upload on the next save.
        setState((current) => ({ ...current, imageUrl: updated.imageUrl }));
      } catch (err) {
        setError(err);
      } finally {
        setImageBusy(false);
      }
    },
    [id],
  );

  const removeNow = useCallback(async () => {
    setImageBusy(true);
    setError(null);
    try {
      await deleteMotorcycleImage(id);
      setState((current) => ({ ...current, imageUrl: null }));
    } catch (err) {
      setError(err);
    } finally {
      setImageBusy(false);
    }
  }, [id]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await updateMotorcycle(id, payload);
      } else {
        const created = await createMotorcycle(payload);
        if (pendingImage) {
          // The record exists now, so the image it was created with can finally be sent.
          // A failure here must not read as "nothing was saved" — the motorcycle is created.
          try {
            await uploadMotorcycleImage(created.id, pendingImage);
          } catch (imageError) {
            navigate(`/admin/motorcycles/${created.id}`, {
              state: { imageError: imageError.message },
            });
            return;
          }
        }
      }
      navigate('/admin');
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label={t('admin.form.loadingMotorcycle')} />
      </div>
    );
  }

  // A failed load leaves nothing to edit, so the form is replaced entirely.
  if (isEditing && error && !state.brand) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorMessage error={error} />
        <Link to="/admin" className="mt-6 inline-block text-sm font-medium text-accent-700">
          {t('admin.form.backToAdministration')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-accent-700 dark:text-zinc-400"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('admin.form.backToAdministration')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          {isEditing ? t('admin.form.editMotorcycle') : t('admin.form.newMotorcycle')}
        </h1>
        {isEditing && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t('admin.form.fullReplacementNotice')}
          </p>
        )}
      </div>

      <MotorcycleForm
        state={state}
        onChange={setState}
        onSubmit={handleSubmit}
        onImageUpload={isEditing ? uploadNow : undefined}
        onImageRemove={isEditing ? removeNow : undefined}
        onImageSelected={isEditing ? undefined : setPendingImage}
        submitting={submitting}
        imageBusy={imageBusy}
        error={error}
        submitLabel={isEditing ? t('admin.form.saveChanges') : t('admin.form.createMotorcycle')}
      />
    </div>
  );
}
