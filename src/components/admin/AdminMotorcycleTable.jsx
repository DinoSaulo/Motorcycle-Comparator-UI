import { Link } from 'react-router-dom';
import { Gauge, Pencil, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../../services/api';
import {
  formatCategory,
  formatCurrency,
  formatDisplayName,
  formatEngineSize,
} from '../../utils/formatters';

export default function AdminMotorcycleTable({ motorcycles, onDelete, busyId }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/70">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Motorcycle</th>
            <th scope="col" className="px-4 py-3 font-semibold">Category</th>
            <th scope="col" className="px-4 py-3 font-semibold">Year</th>
            <th scope="col" className="px-4 py-3 font-semibold">Engine</th>
            <th scope="col" className="px-4 py-3 font-semibold">Price</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {motorcycles.map((motorcycle) => {
            const name = formatDisplayName(motorcycle);
            const image = resolveImageUrl(motorcycle.imageUrl);
            const busy = busyId === motorcycle.id;

            return (
              <tr
                key={motorcycle.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
                aria-busy={busy}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {image ? (
                        <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                          <Gauge className="size-5" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900 dark:text-white">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-zinc-400">{motorcycle.slug}</span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {formatCategory(motorcycle.category)}
                </td>
                <td className="numeric px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {motorcycle.modelYear}
                </td>
                <td className="numeric px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {formatEngineSize(motorcycle.engine?.displacementCc)}
                </td>
                <td className="numeric px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {formatCurrency(motorcycle.priceEur)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/admin/motorcycles/${motorcycle.id}`}
                      aria-label={`Edit ${name}`}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(motorcycle)}
                      disabled={busy}
                      aria-label={`Delete ${name}`}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
