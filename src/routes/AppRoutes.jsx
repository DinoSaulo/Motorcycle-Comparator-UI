import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

// The home page is the entry point for every visitor, so it ships in the main
// bundle; the rest are split off and fetched on demand.
import HomePage from '../pages/HomePage';

const ComparePage = lazy(() => import('../pages/ComparePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
// The admin bundle carries the whole edit form and never loads for a normal visitor.
const AdminPage = lazy(() => import('../pages/AdminPage'));
const AdminMotorcycleFormPage = lazy(() => import('../pages/AdminMotorcycleFormPage'));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-96 items-center justify-center">
          <LoadingSpinner label="Loading page" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        {/* Each admin screen gates itself on the session, so there is no separate
            login route to bookmark or get redirected back from. */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/motorcycles/new" element={<AdminMotorcycleFormPage />} />
        <Route path="/admin/motorcycles/:id" element={<AdminMotorcycleFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
