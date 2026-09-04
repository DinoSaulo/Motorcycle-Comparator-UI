// Top-line stat card: label + large value; em dash when value is null/undefined.
export default function StatCard({ label, value }) {
  const displayValue = value === null || value === undefined ? '—' : String(value);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{displayValue}</p>
    </div>
  );
}
