import { useLanguage } from '../../hooks/useLanguage';
import { completenessRatio } from '../../utils/catalogStats';
import StatBar from './StatBar';

// Renders data completeness for a group (e.g., engine specs); StatBar per field, sorted by gaps desc.
export default function CompletenessList({ title, fieldGaps, total }) {
  const { t } = useLanguage();

  // Sort by gap count descending (worst first)
  const sorted = Object.entries(fieldGaps)
    .map(([field, gaps]) => ({ field, gaps }))
    .sort((a, b) => b.gaps - a.gaps);

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <div className="mt-3 space-y-3">
        {sorted.map(({ field, gaps }) => (
          <StatBar
            key={field}
            label={t(`fields.${field}`)}
            ratio={completenessRatio(total, gaps)}
            count={gaps}
          />
        ))}
      </div>
    </div>
  );
}
