import { Link, NavLink } from 'react-router-dom';
import { Bike, GitCompareArrows, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import LanguageSwitcher from './LanguageSwitcher';

const linkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-50 text-accent-700 dark:bg-accent-700/15 dark:text-accent-300'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
  ].join(' ');

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/85">
      <nav
        aria-label={t('nav.mainLabel')}
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          <Bike className="size-6 text-accent-600 dark:text-accent-500" aria-hidden="true" />
          Motorcycle Comparator
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            {t('nav.catalogue')}
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            <span className="flex items-center gap-1.5">
              <GitCompareArrows className="size-4" aria-hidden="true" />
              {t('nav.compare')}
            </span>
          </NavLink>

          {/* Surfaced only to a signed-in admin: /admin stays reachable by URL for
              everyone else, it simply shows the login form. */}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t('nav.admin')}
              </span>
            </NavLink>
          )}

          <div className="ml-1">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    </header>
  );
}
