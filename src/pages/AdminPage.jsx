import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Plus, ShieldCheck } from 'lucide-react';
import LoginForm from '../components/admin/LoginForm';
import AdminMotorcycleTable from '../components/admin/AdminMotorcycleTable';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { useMotorcycles } from '../hooks/useMotorcycles';
import { deleteMotorcycle } from '../services/motorcycleService';
import { formatDisplayName } from '../utils/formatters';

const PAGE_SIZE = 15;

export default function AdminPage() {
  const { isAuthenticated, isAdmin, username, signOut } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoginForm />
      </div>
    );
  }

  return <AdminDashboard username={username} onSignOut={signOut} />;
}

function AdminDashboard({ username, onSignOut }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);
  const filter = useMemo(() => ({ q: debouncedQuery.trim().slice(0, 100) }), [debouncedQuery]);

  const { motorcycles, pageInfo, loading, error, refetch } = useMotorcycles({
    filter,
    page,
    size: PAGE_SIZE,
    sort: 'id,desc',
  });

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);

    try {
      await deleteMotorcycle(pendingDelete.id);
      setPendingDelete(null);
      // The list is server-paged, so the removed row has to come back from the API,
      // not be spliced out of local state.
      refetch();
    } catch (err) {
      setActionError(err);
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, refetch]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 dark:bg-accent-700/20 dark:text-accent-300">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Administrator
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Catalogue administration
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as <span className="font-medium">{username}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/motorcycles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            New motorcycle
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="admin-search" className="sr-only">
          Search the catalogue
        </label>
        <input
          id="admin-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search by brand, model or slug…"
          className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorMessage error={actionError} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label="Loading catalogue" />
        </div>
      )}

      {!loading && !error && motorcycles.length === 0 && (
        <p className="py-20 text-center text-zinc-500 dark:text-zinc-400">No motorcycles found.</p>
      )}

      {!loading && motorcycles.length > 0 && (
        <>
          <AdminMotorcycleTable
            motorcycles={motorcycles}
            onDelete={setPendingDelete}
            busyId={deleting ? pendingDelete?.id : null}
          />

          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm">
            <span className="numeric text-zinc-500 dark:text-zinc-400">
              {pageInfo.totalElements} motorcycles · page {pageInfo.number + 1} of{' '}
              {pageInfo.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageInfo.first}
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={pageInfo.last}
                className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
          </nav>
        </>
      )}

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this motorcycle?"
        description="This also removes its uploaded image. The action cannot be undone."
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold">{formatDisplayName(pendingDelete)}</span> will be removed
          from the catalogue permanently.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <LoadingSpinner size="sm" label="Deleting" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
