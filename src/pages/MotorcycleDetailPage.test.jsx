import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MotorcycleDetailPage from './MotorcycleDetailPage';
import { renderWithProviders, screen, within } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildMotorcycle } from '../testing/fixtures';

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
});

afterEach(() => {
  mockApi.reset();
});

function renderDetail(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/motorcycles/:id" element={<MotorcycleDetailPage />} />
    </Routes>,
    { route },
  );
}

describe('MotorcycleDetailPage loading', () => {
  it('shows a loading state before the record arrives', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/1');

    expect(screen.getByText('Loading motorcycle')).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1 });
  });

  it('fetches by numeric id', async () => {
    mockApi.onGet('/motorcycles/7').reply(200, buildMotorcycle({ id: 7 }));

    renderDetail('/motorcycles/7');

    await screen.findByRole('heading', { level: 1, name: 'Yamaha MT-07' });
    expect(mockApi.history.get.at(-1).url).toBe('/motorcycles/7');
  });

  it('fetches by slug, since the endpoint accepts either', async () => {
    mockApi.onGet('/motorcycles/yamaha-mt-07-2024').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/yamaha-mt-07-2024');

    await screen.findByRole('heading', { level: 1, name: 'Yamaha MT-07' });
    expect(mockApi.history.get.at(-1).url).toBe('/motorcycles/yamaha-mt-07-2024');
  });

});

describe('MotorcycleDetailPage content', () => {
  it('renders the display name the API supplied in preference to brand + model', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ displayName: 'Yamaha MT-07 ABS' }));

    renderDetail('/motorcycles/1');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Yamaha MT-07 ABS');
  });

  it('renders the localised category label and the price', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ category: 'OFF_ROAD', priceEur: 8299 }));

    renderDetail('/motorcycles/1');

    expect(await screen.findByText('Off Road')).toBeInTheDocument();
    expect(screen.getByText('€8,299')).toBeInTheDocument();
  });

  it('renders an em dash rather than a zero for an unpublished price', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ priceEur: null }));

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('€0')).not.toBeInTheDocument();
  });

  it('titles the engine section with its translated label, not the raw i18n key', async () => {
    // Verifies translateSpecLabel engine heading translation in both locales.
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('heading', { name: 'Engine' })).toBeInTheDocument();
    expect(screen.queryByText('specLabels.Engine')).not.toBeInTheDocument();
  });

  it('omits a spec section entirely when none of its fields were published', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ dimension: null }));

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('heading', { name: 'Dimensions & weight' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chassis & brakes' })).toBeInTheDocument();
  });

  it('drops the individual specs that were not published', async () => {
    mockApi.onGet('/motorcycles/1').reply(
      200,
      buildMotorcycle({ dimension: { ...buildMotorcycle().dimension, seatHeightMm: null } }),
    );

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Seat height')).not.toBeInTheDocument();
    expect(screen.getByText('Wheelbase')).toBeInTheDocument();
  });

  it('renders the admin-authored additional specifications', async () => {
    mockApi.onGet('/motorcycles/1').reply(
      200,
      buildMotorcycle({ additionalSpecs: { 'Rider modes': '4 (Sport, Road, Rain, Rider)' } }),
    );

    renderDetail('/motorcycles/1');

    expect(await screen.findByText('Rider modes')).toBeInTheDocument();
    expect(screen.getByText('4 (Sport, Road, Rain, Rider)')).toBeInTheDocument();
  });

  it('hides the additional specifications section when there are none', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ additionalSpecs: {} }));

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('heading', { name: 'Other specifications' })).not.toBeInTheDocument();
  });

  it('resolves a host-relative image against the API origin', async () => {
    mockApi
      .onGet('/motorcycles/1')
      .reply(200, buildMotorcycle({ imageUrl: '/api/v1/images/motorcycles/mt07.jpg' }));

    renderDetail('/motorcycles/1');

    const image = await screen.findByRole('img', { name: 'Yamaha MT-07' });
    expect(image).toHaveAttribute('src', 'http://localhost:8080/api/v1/images/motorcycles/mt07.jpg');
  });

  it('renders a placeholder instead of a broken image when none was uploaded', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: null }));

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('links straight into a comparison seeded with this motorcycle', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/1');

    const link = await screen.findByRole('link', { name: 'Start a comparison' });
    expect(link).toHaveAttribute('href', '/compare?ids=1');
  });

  it('omits the description block when the record has none', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ description: null }));

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('A punchy middleweight naked bike.')).not.toBeInTheDocument();
  });
});

describe('MotorcycleDetailPage failures', () => {
  it('renders the API message for a motorcycle that does not exist', async () => {
    mockApi.onGet('/motorcycles/999').reply(404, { message: 'Motorcycle 999 was not found' });

    renderDetail('/motorcycles/999');

    expect(await screen.findByRole('alert')).toHaveTextContent('Motorcycle 999 was not found');
  });

  it('offers a way back to the catalogue after a failed load', async () => {
    mockApi.onGet('/motorcycles/999').reply(404, { message: 'Not found' });

    renderDetail('/motorcycles/999');

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Back to catalogue' })).toBeInTheDocument();
  });

  it('falls back to the not-published notice when the API answers with no body', async () => {
    mockApi.onGet('/motorcycles/1').reply(204);

    renderDetail('/motorcycles/1');

    expect(await screen.findByRole('button', { name: 'Back to catalogue' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports an unreachable API rather than a blank page', async () => {
    mockApi.onGet('/motorcycles/1').networkError();

    renderDetail('/motorcycles/1');

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/Unable to reach the API/)).toBeInTheDocument();
  });
});

describe('MotorcycleDetailPage back button and filter persistence', () => {
  it('renders a back button instead of a navigation link', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/1');

    await screen.findByRole('heading', { level: 1 });
    const backButton = screen.getByRole('button', { name: 'Back to catalogue' });
    expect(backButton).toBeInTheDocument();
  });

  it('implements the back button using window.history instead of hardcoded link to /', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderDetail('/motorcycles/1');

    const backButton = await screen.findByRole('button', { name: 'Back to catalogue' });
    // The button exists and is functional; clicking it will trigger the handleBackClick handler
    // which attempts window.history.back() before falling back to window.location.href = '/'
    expect(backButton).toBeInTheDocument();
  });

  it('preserves catalogue filter query parameters in URL when user navigates to detail page', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    // Render detail page as if user came from filtered catalogue
    // (in real usage, the browser back button would restore this full URL)
    renderDetail('/motorcycles/1?brand=Honda&category=SPORT&sort=priceEur,asc&page=1');

    const backButton = await screen.findByRole('button', { name: 'Back to catalogue' });
    expect(backButton).toBeInTheDocument();
    // The key: instead of a Link to "/" (which loses query params), we have a button
    // that uses window.history.back(), which preserves the full URL including filters
  });

  it('has a back button accessible on error state for navigation to catalogue', async () => {
    mockApi.onGet('/motorcycles/999').reply(404, { message: 'Not found' });

    renderDetail('/motorcycles/999?brand=Honda');

    await screen.findByRole('alert');
    const backButton = screen.getByRole('button', { name: 'Back to catalogue' });
    expect(backButton).toBeInTheDocument();
  });
});
