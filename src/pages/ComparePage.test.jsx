import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ComparePage from './ComparePage';
import { renderWithProviders, screen, waitFor, within } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildComparison, buildMotorcycle, buildPage } from '../testing/fixtures';

// Tests ComparePage behavior driven by ?ids= query string URL state.

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

const mt07 = buildMotorcycle({ id: 1, brand: 'Yamaha', model: 'MT-07' });
const cb650r = buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R', slug: 'honda-cb650r' });

function renderCompare(route) {
  return renderWithProviders(<ComparePage />, { route });
}

function comparisonRequests() {
  return mockApi.history.get.filter((entry) => entry.url === '/motorcycles/compare');
}

describe('ComparePage id range', () => {
  it('asks for a selection instead of requesting a comparison with no ids', async () => {
    renderCompare('/compare');

    expect(await screen.findByRole('heading', { name: 'Nothing selected yet' })).toBeInTheDocument();
    expect(comparisonRequests()).toHaveLength(0);
  });

  it('asks for one more motorcycle when only a single id is in the URL', async () => {
    renderCompare('/compare?ids=1');

    expect(await screen.findByRole('heading', { name: 'Add 1 more motorcycle' })).toBeInTheDocument();
    expect(comparisonRequests()).toHaveLength(0);
  });

  it('never requests a comparison for more than the four ids the endpoint accepts', async () => {
    renderCompare('/compare?ids=1,2,3,4,5');

    await screen.findByRole('heading', { name: 'Comparison' });
    expect(comparisonRequests()).toHaveLength(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('ignores non-numeric and duplicate ids from a hand-edited URL', async () => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,1,abc,2');

    await screen.findByRole('table');
    expect(comparisonRequests()[0].params).toEqual({ ids: '1,2' });
  });
});

describe('ComparePage comparison rendering', () => {
  it('shows a loading state while the comparison is being built', async () => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');

    expect(screen.getByText('Building comparison')).toBeInTheDocument();
    await screen.findByRole('table');
  });

  it('renders the rows exactly as the API grouped and labelled them', async () => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('rowheader', { name: /Max power/ })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Yamaha MT-07/ })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Honda CB650R/ })).toBeInTheDocument();
  });

  it('marks the winning column with more than colour alone', async () => {
    const stronger = buildMotorcycle({
      id: 2,
      brand: 'Honda',
      model: 'CB650R',
      engine: { ...mt07.engine, maxPowerHp: 94 },
    });
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, stronger]));

    renderCompare('/compare?ids=1,2');

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Best value')).toBeInTheDocument();
  });

  it('renders an em dash for a value the API did not publish', async () => {
    const comparison = buildComparison([mt07, cb650r]);
    comparison.groups[1].rows[0].values = [73.4, null];
    mockApi.onGet('/motorcycles/compare').reply(200, comparison);

    renderCompare('/compare?ids=1,2');

    const row = within(await screen.findByRole('table')).getByRole('row', { name: /Max power/ });
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('filters the table down to the rows the API flagged as differing', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('rowheader', { name: /Model year/ })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Show differences only' }));

    expect(within(table).queryByRole('rowheader', { name: /Model year/ })).not.toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: /Max power/ })).toBeInTheDocument();
  });

  it('explains an all-identical result rather than showing an empty table', async () => {
    const user = userEvent.setup({ delay: null });
    const comparison = buildComparison([mt07, cb650r]);
    comparison.groups.forEach((group) => group.rows.forEach((row) => { row.differing = false; }));
    mockApi.onGet('/motorcycles/compare').reply(200, comparison);

    renderCompare('/compare?ids=1,2');
    await screen.findByRole('table');

    await user.click(screen.getByRole('checkbox', { name: 'Show differences only' }));

    expect(
      screen.getByText('These motorcycles have identical published specifications.'),
    ).toBeInTheDocument();
  });

  it('surfaces the normalised ApiError when the comparison fails', async () => {
    mockApi.onGet('/motorcycles/compare').reply(404, { message: 'Motorcycle 2 was not found' });

    renderCompare('/compare?ids=1,2');

    expect(await screen.findByRole('alert')).toHaveTextContent('Motorcycle 2 was not found');
  });
});

describe('ComparePage selection editing', () => {
  it('drops a motorcycle from the URL when its remove button is used', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Remove Honda CB650R from comparison' }));

    expect(await screen.findByRole('heading', { name: 'Add 1 more motorcycle' })).toBeInTheDocument();
  });

  it('adds a motorcycle picked from the empty-state search', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles').reply(200, buildPage([cb650r]));
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1');
    await screen.findByRole('heading', { name: 'Add 1 more motorcycle' });

    await user.type(screen.getByRole('searchbox', { name: 'Search motorcycles' }), 'cb');
    await user.click(await screen.findByRole('option', { name: /Honda CB650R/ }, { timeout: 3000 }));

    await screen.findByRole('table');
    expect(comparisonRequests().at(-1).params).toEqual({ ids: '1,2' });
  });

  it('adds a motorcycle through the modal picker once a comparison exists', async () => {
    const user = userEvent.setup({ delay: null });
    const third = buildMotorcycle({ id: 3, brand: 'KTM', model: '890 Duke', slug: 'ktm-890-duke' });
    mockApi.onGet('/motorcycles').reply(200, buildPage([third]));
    mockApi.onGet('/motorcycles/compare').reply((config) => [
      200,
      buildComparison(config.params.ids === '1,2' ? [mt07, cb650r] : [mt07, cb650r, third]),
    ]);

    renderCompare('/compare?ids=1,2');
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Add motorcycle' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a motorcycle' });

    await user.type(within(dialog).getByRole('searchbox', { name: 'Search motorcycles' }), 'ktm');
    await user.click(await screen.findByRole('option', { name: /KTM 890 Duke/ }, { timeout: 3000 }));

    await waitFor(() => expect(comparisonRequests().at(-1).params).toEqual({ ids: '1,2,3' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the picker without changing the selection', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Add motorcycle' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(comparisonRequests()).toHaveLength(1);
  });

  it('offers the add-a-slot card while there is room for another motorcycle', async () => {
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison([mt07, cb650r]));

    renderCompare('/compare?ids=1,2');
    await screen.findByRole('table');

    expect(screen.getByText('2 slots left')).toBeInTheDocument();
  });

  it('hides the add affordances once four motorcycles are compared', async () => {
    const bikes = [1, 2, 3, 4].map((id) =>
      buildMotorcycle({ id, brand: 'Brand', model: `M${id}`, slug: `brand-m${id}` }),
    );
    mockApi.onGet('/motorcycles/compare').reply(200, buildComparison(bikes));

    renderCompare('/compare?ids=1,2,3,4');
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: 'Add motorcycle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add motorcycle/ })).not.toBeInTheDocument();
  });
});
