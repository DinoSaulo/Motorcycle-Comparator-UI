import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppRoutes from './AppRoutes';
import { renderWithProviders, screen, waitFor } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildComparison, buildMotorcycle, buildPage, buildSession } from '../testing/fixtures';

/**
 * Route-level integration. Every page except the catalogue is behind `React.lazy`, so
 * these assertions have to await the `Suspense` boundary rather than query synchronously.
 */

const LANGUAGE_KEY = 'motorcycle-comparator.language';
const SESSION_KEY = 'motorcycle-comparator.session';
const TOKEN_KEY = 'motorcycle-comparator.token';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

function stubCatalogue() {
  mockApi.onGet('/motorcycles/brands').reply(200, ['Yamaha']);
  mockApi.onGet('/motorcycles').reply(200, buildPage([buildMotorcycle()]));
}

function seedAdminSession() {
  const session = buildSession();
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
}

describe('AppRoutes', () => {
  it('mounts the catalogue at the root without waiting on a lazy chunk', async () => {
    stubCatalogue();

    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(screen.getByRole('heading', { name: 'Compare motorcycles, spec by spec' })).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
  });

  // Must stay ahead of every other /compare case: the lazy chunk is cached after the
  // first import, so only the first render of it can show the Suspense fallback.
  it('shows the suspense fallback before a lazy chunk resolves', async () => {
    renderWithProviders(<AppRoutes />, { route: '/compare' });

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Comparison' });
  });

  it('resolves the lazy comparison page at /compare', async () => {
    renderWithProviders(<AppRoutes />, { route: '/compare' });

    expect(await screen.findByRole('heading', { name: 'Comparison' })).toBeInTheDocument();
  });

  it('passes the comparison ids from the query string through to the API', async () => {
    const bikes = [buildMotorcycle(), buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R' })];
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison(bikes));

    renderWithProviders(<AppRoutes />, { route: '/compare?ids=1,2' });

    await screen.findByRole('table');
    expect(mockApi.history.get.at(-1).params).toEqual({ ids: '1,2' });
  });

  it('resolves the lazy detail page at /motorcycles/:id', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderWithProviders(<AppRoutes />, { route: '/motorcycles/1' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Yamaha MT-07' })).toBeInTheDocument();
  });

  it('resolves the lazy admin page at /admin', async () => {
    renderWithProviders(<AppRoutes />, { route: '/admin' });

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });

  it('resolves the lazy admin create form at /admin/motorcycles/new', async () => {
    seedAdminSession();

    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/new' });

    expect(await screen.findByRole('heading', { name: 'New motorcycle' })).toBeInTheDocument();
  });

  it('resolves the lazy admin edit form at /admin/motorcycles/:id', async () => {
    seedAdminSession();
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/1' });

    expect(await screen.findByRole('heading', { name: 'Edit motorcycle' })).toBeInTheDocument();
  });

  it('routes an unknown path to the not-found page', async () => {
    renderWithProviders(<AppRoutes />, { route: '/no-such-road' });

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('treats a deep unknown admin path as not found rather than an admin screen', async () => {
    seedAdminSession();

    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/1/extra' });

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows the login form on an admin route when there is no session', async () => {
    renderWithProviders(<AppRoutes />, { route: '/admin/motorcycles/new' });

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    await waitFor(() => expect(mockApi.history.get).toHaveLength(0));
  });
});
