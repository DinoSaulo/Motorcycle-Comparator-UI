import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { mockApi } from './testing/mockApi';
import { buildMotorcycle, buildPage, buildSession } from './testing/fixtures';

/**
 * `App` supplies its own `LanguageProvider`/`AuthProvider`, so these tests wrap it in a
 * router only — using `renderWithProviders` here would nest a second copy of each.
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

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

function stubCatalogue(page = buildPage([buildMotorcycle()])) {
  mockApi.onGet('/motorcycles/brands').reply(200, ['Yamaha']);
  mockApi.onGet('/motorcycles').reply(200, page);
}

function seedAdminSession() {
  const session = buildSession();
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
}

describe('App shell', () => {
  it('renders the skip link ahead of the navigation', () => {
    stubCatalogue();

    renderApp();

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });

  it('puts the routed page inside the main landmark the skip link targets', async () => {
    stubCatalogue();

    renderApp();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    await waitFor(() => expect(main).toHaveTextContent('Compare motorcycles, spec by spec'));
  });

  it('renders the navigation and the footer around every page', async () => {
    stubCatalogue();

    renderApp();

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
  });

  it('hides the admin link from an anonymous visitor', async () => {
    stubCatalogue();

    renderApp();

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
  });

  it('surfaces the admin link once an admin session is restored', async () => {
    seedAdminSession();
    stubCatalogue();

    renderApp();

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
  });

  it('re-renders the whole shell in the language the visitor picks', async () => {
    const user = userEvent.setup({ delay: null });
    stubCatalogue();

    renderApp();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(await screen.findByRole('option', { name: /Português/ }));

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Skip to main content' })).not.toBeInTheDocument(),
    );
    expect(document.documentElement.lang).toBe('pt');
  });
});

describe('App routing', () => {
  it('mounts the catalogue at /', async () => {
    stubCatalogue();

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Yamaha MT-07' })).toBeInTheDocument();
  });

  it('mounts the comparison at /compare', async () => {
    renderApp('/compare');

    expect(await screen.findByRole('heading', { name: 'Comparison' })).toBeInTheDocument();
  });

  it('mounts the detail page at /motorcycles/:id', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderApp('/motorcycles/1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Yamaha MT-07' })).toBeInTheDocument();
  });

  it('mounts the admin area at /admin', async () => {
    renderApp('/admin');

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
  });

  it('mounts the not-found page for an unmatched path', async () => {
    renderApp('/nowhere');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('navigates between pages through the navigation bar', async () => {
    const user = userEvent.setup({ delay: null });
    stubCatalogue();

    renderApp('/');
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('link', { name: 'Compare' }));

    expect(await screen.findByRole('heading', { name: 'Comparison' })).toBeInTheDocument();
  });

  it('opens a motorcycle from the catalogue grid', async () => {
    const user = userEvent.setup({ delay: null });
    stubCatalogue();
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderApp('/');
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('link', { name: /Yamaha MT-07/ }));

    expect(await screen.findByRole('link', { name: 'Start a comparison' })).toBeInTheDocument();
  });
});

describe('App error boundary', () => {
  it('contains a page-level render crash instead of blanking the application', async () => {
    // A payload the API should never produce: the missing record makes the catalogue
    // grid throw while rendering, which is exactly what the boundary exists for.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubCatalogue(buildPage([null]));

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    // The shell survives: navigation and footer are still there.
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('lets the visitor retry after a contained crash', async () => {
    const user = userEvent.setup({ delay: null });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let responses = 0;
    mockApi.onGet('/motorcycles/brands').reply(200, ['Yamaha']);
    mockApi.onGet('/motorcycles').reply(() => {
      responses += 1;
      return [200, responses === 1 ? buildPage([null]) : buildPage([buildMotorcycle()])];
    });

    renderApp('/');
    await screen.findByRole('heading', { name: 'Something went wrong' });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Yamaha MT-07' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
