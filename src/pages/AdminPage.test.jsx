import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AdminPage from './AdminPage';
import { renderWithProviders, screen, waitFor, within } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { getStoredToken } from '../services/api';
import {
  buildMotorcycle,
  buildPage,
  buildSession,
  seedStoredSession,
  SESSION_STORAGE_KEY as SESSION_KEY,
} from '../testing/fixtures';

// AdminPage test suite covering anonymous login form and authenticated dashboard.

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

function seedSession(overrides) {
  return seedStoredSession(buildSession(overrides));
}

const mt07 = buildMotorcycle({ id: 1, brand: 'Yamaha', model: 'MT-07' });
const cb650r = buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R', slug: 'honda-cb650r' });

function catalogueRequests() {
  return mockApi.history.get.filter((entry) => entry.url === '/motorcycles');
}

describe('AdminPage authentication gate', () => {
  it('shows the login form to an anonymous visitor', async () => {
    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Catalogue administration' })).not.toBeInTheDocument();
  });

  it('shows the login form when the stored session has expired', async () => {
    seedSession({ expiresAt: new Date(Date.now() - 1000).toISOString() });

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });

  it('shows the login form to a signed-in account without the admin role', async () => {
    seedSession({ roles: ['ROLE_EDITOR'] });

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });

  it('opens the dashboard after a successful admin login', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/auth/login').reply(200, buildSession());
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 's3cret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Catalogue administration' })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('sends the credentials the admin typed to the login endpoint', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/auth/login').reply(200, buildSession());
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 's3cret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByRole('heading', { name: 'Catalogue administration' });
    expect(JSON.parse(mockApi.history.post[0].data)).toEqual({ username: 'admin', password: 's3cret' });
  });

  it('arms the axios interceptor so the catalogue request carries the bearer token', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/auth/login').reply(200, buildSession({ accessToken: 'fresh.jwt' }));
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 's3cret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByRole('heading', { name: 'Catalogue administration' });
    await waitFor(() => expect(catalogueRequests()).toHaveLength(1));
    expect(catalogueRequests()[0].headers.Authorization).toBe('Bearer fresh.jwt');
  });

  it('renders the API message when the credentials are rejected', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/auth/login').reply(401, { message: 'Bad credentials' });

    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bad credentials');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('refuses a valid non-admin login instead of showing an admin screen that would 403', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/auth/login').reply(200, buildSession({ roles: ['ROLE_EDITOR'] }));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.type(screen.getByLabelText('Username'), 'editor');
    await user.type(screen.getByLabelText('Password'), 's3cret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account does not have administrator permissions.',
    );
    // The editor's token is real and was armed by `login()`; refusing the screen has to
    // disarm it too, or the client keeps signing requests for a session the UI denies.
    expect(getStoredToken()).toBeNull();
  });

  it('returns to the login form when the admin signs out', async () => {
    const user = userEvent.setup({ delay: null });
    seedSession();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('heading', { name: 'Catalogue administration' });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe('AdminPage catalogue table', () => {
  beforeEach(() => {
    seedSession();
  });

  it('lists the catalogue newest first', async () => {
    mockApi.onGet('/motorcycles').reply(200, buildPage([cb650r, mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(await screen.findByText('honda-cb650r')).toBeInTheDocument();
    expect(catalogueRequests()[0].params).toEqual({ page: 0, size: 15, sort: 'id,desc' });
  });

  it('shows a loading state before the catalogue arrives', async () => {
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(screen.getByText('Loading catalogue')).toBeInTheDocument();
    await screen.findByRole('table');
  });

  it('reports an empty catalogue rather than an empty table', async () => {
    mockApi.onGet('/motorcycles').reply(200, buildPage([]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    expect(await screen.findByText('No motorcycles found.')).toBeInTheDocument();
  });

  it('renders the API failure with a retry that reloads the list', async () => {
    const user = userEvent.setup({ delay: null });
    let attempts = 0;
    mockApi.onGet('/motorcycles').reply(() => {
      attempts += 1;
      return attempts === 1 ? [503, { message: 'Catalogue unavailable' }] : [200, buildPage([mt07])];
    });

    renderWithProviders(<AdminPage />, { route: '/admin' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue unavailable');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('searches the catalogue with the debounced term', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('table');

    await user.type(screen.getByLabelText('Search the catalogue'), 'honda');

    await waitFor(() => expect(catalogueRequests().at(-1).params).toMatchObject({ q: 'honda' }), {
      timeout: 3000,
    });
  });

  it('pages through the catalogue', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply((config) => [
      200,
      buildPage([mt07], {
        totalElements: 30,
        totalPages: 2,
        number: config.params.page,
        first: config.params.page === 0,
        last: config.params.page === 1,
      }),
    ]);

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('30 motorcycles · page 1 of 2');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('30 motorcycles · page 2 of 2')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => expect(screen.getByText('30 motorcycles · page 1 of 2')).toBeInTheDocument());
  });

  it('links each row to its edit screen', async () => {
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });

    const link = await screen.findByRole('link', { name: 'Edit Yamaha MT-07' });
    expect(link).toHaveAttribute('href', '/admin/motorcycles/1');
  });

  it('links to the create screen', async () => {
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('table');

    expect(screen.getByRole('link', { name: 'New motorcycle' })).toHaveAttribute(
      'href',
      '/admin/motorcycles/new',
    );
  });
});

describe('AdminPage delete flow', () => {
  beforeEach(() => {
    seedSession();
  });

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Yamaha MT-07' }));

    const dialog = await screen.findByRole('dialog', { name: 'Delete this motorcycle?' });
    expect(within(dialog).getByText('Yamaha MT-07')).toBeInTheDocument();
    expect(mockApi.history.delete).toHaveLength(0);
  });

  it('leaves the record alone when the confirmation is cancelled', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Yamaha MT-07' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockApi.history.delete).toHaveLength(0);
  });

  it('deletes the record and reloads the server-paged list', async () => {
    const user = userEvent.setup({ delay: null });
    let loads = 0;
    mockApi.onGet('/motorcycles').reply(() => {
      loads += 1;
      return [200, buildPage(loads === 1 ? [mt07, cb650r] : [cb650r])];
    });
    mockApi.onDelete('/motorcycles/1').reply(204);

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByText('yamaha-mt-07-2024');

    await user.click(screen.getByRole('button', { name: 'Delete Yamaha MT-07' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('yamaha-mt-07-2024')).not.toBeInTheDocument());
    expect(mockApi.history.delete).toHaveLength(1);
    expect(loads).toBe(2);
  });

  it('keeps the row and reports the reason when the delete is refused', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07]));
    mockApi.onDelete('/motorcycles/1').reply(409, { message: 'Motorcycle is referenced elsewhere' });

    renderWithProviders(<AdminPage />, { route: '/admin' });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Yamaha MT-07' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Motorcycle is referenced elsewhere')).toBeInTheDocument();
    expect(screen.getByText('yamaha-mt-07-2024')).toBeInTheDocument();
  });
});
