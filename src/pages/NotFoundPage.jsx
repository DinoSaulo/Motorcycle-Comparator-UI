import { Link } from 'react-router-dom';
import { Bike } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Bike className="mx-auto size-12 text-zinc-300 dark:text-zinc-700" aria-hidden="true" />
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent-600">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{t('notFound.description')}</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
      >
        {t('nav.backToCatalogue')}
      </Link>
    </div>
  );
}
