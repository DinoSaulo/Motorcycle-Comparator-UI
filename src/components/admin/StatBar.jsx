// Bar chart row: label, width-scaled bar, percentage, gap count. Colour + number for meaning.
export default function StatBar({ label, ratio, count }) {
  const percentage = ratio === null || ratio === undefined ? '—' : `${Math.round(ratio * 100)}%`;
  const barWidth = ratio === null || ratio === undefined ? 0 : `${Math.round(ratio * 100)}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-900 dark:text-white">{label}</span>
        <span className="text-zinc-600 dark:text-zinc-300">
          {percentage} · {count} gap{count !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="progressbar"
        aria-valuenow={ratio ? Math.round(ratio * 100) : 0}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-all"
          style={{ width: typeof barWidth === 'number' ? `${barWidth}%` : barWidth }}
          data-testid="stat-bar-fill"
        />
      </div>
    </div>
  );
}
