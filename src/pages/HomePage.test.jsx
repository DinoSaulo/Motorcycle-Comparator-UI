import { Route, Routes, useSearchParams } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HomePage from './HomePage';
import { renderWithProviders, screen, waitFor, within } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildMotorcycle, buildPage } from '../testing/fixtures';

/**
 * Page-level integration: the real `SearchBar`, `MotorcycleCard`, `useMotorcycles`
 * and `useBrands` all run, with only the HTTP boundary faked through `mockApi`.
 */

const LANGUAGE_KEY = 'motorcycle-comparator.language';

/** The catalogue copy asserted below is the English dictionary; the app defaults to Portuguese. */
beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

function mt07(overrides) {
  return buildMotorcycle({ id: 1, brand: 'Yamaha', model: 'MT-07', ...overrides });
}

function cb650r(overrides) {
  return buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R', slug: 'honda-cb650r', ...overrides });
}

/** Every HomePage render also asks for the brand filter list. */
function stubBrands(brands = ['Honda', 'Yamaha']) {
  mockApi.onGet('/motorcycles/brands').reply(200, brands);
}

/** Reports the ids the page navigated to, so `/compare` needs no real page here. */
function CompareStub() {
  const [params] = useSearchParams();
  return <p>compare stub: {params.get('ids')}</p>;
}

function renderHome() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/compare" element={<CompareStub />} />
    </Routes>,
  );
}

describe('HomePage catalogue', () => {
  it('renders the motorcycles returned by the API', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();

    expect(await screen.findByRole('heading', { name: 'Yamaha MT-07' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Honda CB650R' })).toBeInTheDocument();
  });

  it('announces a loading state while the first page is in flight', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();

    expect(screen.getByText('Loading motorcycles')).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
  });

  it('requests the first page with the default sort and page size', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    const request = mockApi.history.get.find((entry) => entry.url === '/motorcycles');
    expect(request.params).toEqual({ page: 0, size: 12, sort: 'brand,asc' });
  });

  it('tells the visitor when nothing matches instead of rendering an empty grid', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([]));

    renderHome();

    expect(await screen.findByText('No motorcycles match your search.')).toBeInTheDocument();
  });

  it('offers the brands the API returned in the brand filter', async () => {
    stubBrands(['Ducati', 'Honda']);
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();

    const brandFilter = screen.getByLabelText('Filter by brand');
    await waitFor(() => expect(within(brandFilter).getByRole('option', { name: 'Ducati' })).toBeInTheDocument());
  });

  it('degrades to an empty brand filter when the brand list fails', async () => {
    mockApi.onGet('/motorcycles/brands').reply(500, { message: 'brands down' });
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    const brandFilter = screen.getByLabelText('Filter by brand');
    expect(within(brandFilter).getAllByRole('option')).toHaveLength(1);
  });
});

describe('HomePage error handling', () => {
  it('renders the normalised ApiError message from the response body', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(500, { message: 'The catalogue is offline' });

    renderHome();

    expect(await screen.findByRole('alert')).toHaveTextContent('The catalogue is offline');
  });

  it('reports an unreachable API when the request never gets a response', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').networkError();

    renderHome();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to reach the API/);
  });

  it('retries the search when the error banner offers a retry', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    let attempts = 0;
    mockApi.onGet('/motorcycles').reply(() => {
      attempts += 1;
      return attempts === 1 ? [500, { message: 'boom' }] : [200, buildPage([mt07()])];
    });

    renderHome();
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Yamaha MT-07' })).toBeInTheDocument();
  });
});

describe('HomePage filtering and sorting', () => {
  it('re-queries with the chosen brand and resets to the first page', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply((config) => [
      200,
      buildPage([mt07()], {
        totalPages: 3,
        number: config.params.page,
        first: config.params.page === 0,
        last: false,
      }),
    ]);

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Page 2 of 3')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Filter by brand'), 'Honda');

    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toMatchObject({ brand: 'Honda', page: 0 });
    });
  });

  it('re-queries with the chosen category', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.selectOptions(screen.getByLabelText('Filter by category'), 'SPORT');

    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toMatchObject({ category: 'SPORT' });
    });
  });

  it('re-queries with the chosen sort order', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.selectOptions(screen.getByLabelText('Sort results'), 'priceEur,desc');

    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toMatchObject({ sort: 'priceEur,desc' });
    });
  });

  it('hides the clear-filters button until a filter is active, then clears both filters', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter by brand'), 'Honda');
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'NAKED');
    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Filter by brand')).toHaveValue('');
    expect(screen.getByLabelText('Filter by category')).toHaveValue('');
    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toEqual({ page: 0, size: 12, sort: 'brand,asc' });
    });
  });

  it('passes the debounced search term through to the query', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.type(screen.getByRole('searchbox', { name: 'Search motorcycles' }), 'mt-07');

    await waitFor(
      () => {
        const withQuery = mockApi.history.get.filter(
          (entry) => entry.url === '/motorcycles' && entry.params.q === 'mt-07',
        );
        expect(withQuery.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });
});

describe('HomePage pagination', () => {
  it('hides the pagination when everything fits on one page', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('walks forward and back through the pages', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply((config) => {
      const page = config.params.page;
      return [
        200,
        buildPage([mt07()], { totalPages: 2, number: page, first: page === 0, last: page === 1 }),
      ];
    });

    renderHome();
    await screen.findByText('Page 1 of 2');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
  });
});

describe('HomePage selection tray', () => {
  it('stays hidden until something is selected', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    expect(screen.queryByRole('button', { name: /Select \d+ more/ })).not.toBeInTheDocument();
  });

  it('asks for one more bike while the selection is below the minimum', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' }));

    expect(screen.getByRole('button', { name: 'Select 1 more' })).toBeDisabled();
  });

  it('enables the comparison button once two bikes are selected', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Add Honda CB650R to comparison' }));

    expect(screen.getByRole('button', { name: 'Compare 2' })).toBeEnabled();
  });

  it('navigates to the comparison with the selected ids in the query string', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Add Honda CB650R to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Compare 2' }));

    expect(await screen.findByText('compare stub: 1,2')).toBeInTheDocument();
  });

  it('de-selects a bike when its card button is pressed again', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Remove Yamaha MT-07 from comparison' }));

    expect(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' })).toBeInTheDocument();
  });

  it('removes a bike from the tray through its own remove button', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.click(screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Add Honda CB650R to comparison' }));
    await user.click(screen.getByRole('button', { name: 'Remove Honda CB650R from selection' }));

    expect(screen.getByRole('button', { name: 'Select 1 more' })).toBeInTheDocument();
  });

  it('caps the selection at four and disables the remaining cards', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    const bikes = [1, 2, 3, 4, 5].map((id) =>
      buildMotorcycle({ id, brand: 'Brand', model: `M${id}`, slug: `brand-m${id}` }),
    );
    mockApi.onGet('/motorcycles').reply(200, buildPage(bikes));

    renderHome();
    await screen.findByRole('heading', { name: 'Brand M1' });

    for (const id of [1, 2, 3, 4]) {
      // Sequential on purpose: each click changes what the next one is allowed to do.
      await user.click(screen.getByRole('button', { name: `Add Brand M${id} to comparison` }));
    }

    expect(screen.getByRole('button', { name: 'Compare 4' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add Brand M5 to comparison' })).toBeDisabled();
    // A full selection must still be reversible.
    expect(screen.getByRole('button', { name: 'Remove Brand M1 from comparison' })).toBeEnabled();
  });

  it('adds a bike picked from the autocomplete to the selection', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07(), cb650r()]));

    renderHome();
    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    await user.type(screen.getByRole('searchbox', { name: 'Search motorcycles' }), 'mt');
    // 300ms debounce plus a round trip: worth more than the 1s default here.
    const option = await screen.findByRole('option', { name: /Yamaha MT-07/ }, { timeout: 3000 });
    await user.click(option);

    expect(screen.getByRole('button', { name: 'Select 1 more' })).toBeInTheDocument();
  });
});

describe('HomePage filter persistence', () => {
  it('restores filters from URL query parameters when the page loads', async () => {
    stubBrands();
    mockApi.onGet('/motorcycles').reply((config) => {
      // Verify that the API request includes the filters from the URL
      expect(config.params).toMatchObject({ brand: 'Honda', category: 'SPORT', sort: 'priceEur,asc' });
      return [200, buildPage([cb650r()])];
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>,
      { route: '/?brand=Honda&category=SPORT&sort=priceEur,asc' },
    );

    // Wait for the page to load before checking filter values
    await screen.findByRole('heading', { name: 'Honda CB650R' });

    expect(screen.getByLabelText('Filter by brand')).toHaveValue('Honda');
    expect(screen.getByLabelText('Filter by category')).toHaveValue('SPORT');
    expect(screen.getByLabelText('Sort results')).toHaveValue('priceEur,asc');
  });

  it('preserves filters in the URL when changing filters', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>,
      { route: '/?brand=Honda' },
    );

    await screen.findByRole('heading', { name: 'Yamaha MT-07' });

    // Change the category while brand is already in the URL
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'NAKED');

    // Both filters should now be in the URL
    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toMatchObject({ brand: 'Honda', category: 'NAKED' });
    });
  });

  it('clears only the cleared filters from the URL when clearing filters', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply(200, buildPage([mt07()]));

    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>,
      { route: '/?brand=Honda&category=SPORT&sort=priceEur,desc&page=2' },
    );

    await screen.findByRole('heading', { name: 'Yamaha MT-07' });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();

    // Clear filters (brand and category)
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    // Sort and page should remain in the URL, brand and category should be removed
    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params).toMatchObject({ sort: 'priceEur,desc' });
      expect(last.params.brand).toBeUndefined();
      expect(last.params.category).toBeUndefined();
    });
  });

  it('resets to page 0 when changing filters while on a later page', async () => {
    const user = userEvent.setup({ delay: null });
    stubBrands();
    mockApi.onGet('/motorcycles').reply((config) => [
      200,
      buildPage([mt07()], {
        totalPages: 3,
        number: config.params.page,
        first: config.params.page === 0,
        last: false,
      }),
    ]);

    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>,
      { route: '/?page=2' },
    );

    await screen.findByText('Page 3 of 3');

    // Change a filter
    await user.selectOptions(screen.getByLabelText('Filter by brand'), 'Honda');

    // Should reset to page 0
    await waitFor(() => {
      const last = mockApi.history.get.filter((entry) => entry.url === '/motorcycles').at(-1);
      expect(last.params.page).toBe(0);
      expect(last.params.brand).toBe('Honda');
    });
  });
});
