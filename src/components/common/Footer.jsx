export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <p>Motorcycle Comparator — specifications for reference only.</p>
        <p>
          Prices in EUR. Data served by the{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Motorcycle Comparator API
          </span>
          .
        </p>
      </div>
    </footer>
  );
}
