import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ADMIN_ROLE } from '../../services/authService';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

// Credential form for the administration area.
// Validates admin permissions immediately to avoid 403 authorization failures later.
export default function LoginForm() {
  const { signIn, signOut } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const session = await signIn({ username, password });
      if (!session.roles?.includes(ADMIN_ROLE)) {
        // Valid credentials, wrong role. Drop the token immediately rather than let the
        // editor account sit on an admin screen where every action returns 403.
        signOut();
        setError({ message: t('auth.notAdminError') });
      }
    } catch (err) {
      setError(err);
    } finally {
      setPassword('');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-700/20">
            <LockKeyhole className="size-6 text-accent-600 dark:text-accent-400" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t('auth.signInTitle')}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('auth.signInSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t('auth.username')}
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              maxLength={60}
              autoComplete="username"
              autoFocus
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t('auth.password')}
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              maxLength={200}
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoadingSpinner size="sm" label={t('auth.signingIn')} />}
            {submitting ? t('auth.signingInEllipsis') : t('auth.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
