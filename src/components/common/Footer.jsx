import { useLanguage } from '../../hooks/useLanguage';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <p>{t('footer.tagline')}</p>
        <p>
          {t('footer.dataNoticePrefix')}{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t('footer.apiName')}</span>.
        </p>
      </div>
    </footer>
  );
}
