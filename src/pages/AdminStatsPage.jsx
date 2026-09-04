import { BarChart3 } from 'lucide-react';
import LoginForm from '../components/admin/LoginForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import StatCard from '../components/admin/StatCard';
import BreakdownList from '../components/admin/BreakdownList';
import CompletenessList from '../components/admin/CompletenessList';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useCatalogStats } from '../hooks/useCatalogStats';
import { formatCurrency, formatNumber, formatPercent, formatDateTime } from '../utils/formatters';

export default function AdminStatsPage() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <LoginForm />
      </div>
    );
  }

  return <CatalogueInsights />;
}

function CatalogueInsights() {
  const { t } = useLanguage();
  const { stats, loading, error, refetch } = useCatalogStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-start gap-2">
        <BarChart3 className="size-8 shrink-0 text-accent-600 dark:text-accent-500" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            {t('admin.stats.pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {stats?.lastUpdatedAt
              ? `${t('admin.stats.lastUpdated')}: ${formatDateTime(stats.lastUpdatedAt)}`
              : t('admin.stats.noData')}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label={t('common.loading')} />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} onRetry={refetch} />
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Top-line stat cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('admin.stats.totalMotorcycles')}
              value={formatNumber(stats.totalMotorcycles)}
            />
            <StatCard
              label={t('admin.stats.pricedCount')}
              value={formatNumber(stats.priceEur?.pricedCount)}
            />
            <StatCard
              label={t('admin.stats.avgPrice')}
              value={formatCurrency(stats.priceEur?.avg)}
            />
            <StatCard
              label={t('admin.stats.minPrice')}
              value={formatCurrency(stats.priceEur?.min)}
            />
          </div>

          {/* Max price as its own card */}
          <div className="mb-8">
            <StatCard
              label={t('admin.stats.maxPrice')}
              value={formatCurrency(stats.priceEur?.max)}
            />
          </div>

          {/* Breakdowns */}
          {stats.totalMotorcycles > 0 ? (
            <div className="mb-8 grid gap-6 lg:grid-cols-3">
              <BreakdownList
                title={t('admin.stats.byBrand')}
                record={stats.byBrand}
                maxVisible={10}
              />
              <BreakdownList
                title={t('admin.stats.byCategory')}
                record={stats.byCategory}
                maxVisible={10}
              />
              <BreakdownList
                title={t('admin.stats.byModelYear')}
                record={stats.byModelYear}
                maxVisible={10}
              />
            </div>
          ) : null}

          {/* Completeness sections */}
          {stats.totalMotorcycles > 0 ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t('admin.stats.motorcycle.fields')}
                </h2>
                <div className="mt-4 space-y-3">
                  <CompletenessList
                    title={t('admin.stats.motorcycle.fields')}
                    fieldGaps={stats.motorcycleFieldGaps}
                    total={stats.totalMotorcycles}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t('admin.stats.engine.title')}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatNumber(stats.engineSpecifications?.totalRows)}{' '}
                  {t('admin.stats.engine.coverage')} · {formatNumber(stats.engineSpecifications?.motorcyclesWithoutRow)} missing
                </p>
                <div className="mt-4 space-y-3">
                  <CompletenessList
                    title={t('admin.stats.engine.title')}
                    fieldGaps={stats.engineSpecifications?.fieldGaps || {}}
                    total={stats.engineSpecifications?.totalRows || 0}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t('admin.stats.dimensions.title')}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatNumber(stats.dimensions?.totalRows)} {t('admin.stats.dimensions.coverage')} · {formatNumber(stats.dimensions?.motorcyclesWithoutRow)} missing
                </p>
                <div className="mt-4 space-y-3">
                  <CompletenessList
                    title={t('admin.stats.dimensions.title')}
                    fieldGaps={stats.dimensions?.fieldGaps || {}}
                    total={stats.dimensions?.totalRows || 0}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {t('admin.stats.additionalSpecs')}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatNumber(stats.additionalSpecs?.totalEntries)} entries ·{' '}
                  {formatPercent((stats.totalMotorcycles - (stats.additionalSpecs?.motorcyclesWithoutAny || 0)) / stats.totalMotorcycles)}{' '}
                  coverage
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t('admin.stats.noData')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
