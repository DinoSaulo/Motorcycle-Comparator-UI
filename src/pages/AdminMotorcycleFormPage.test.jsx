import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminMotorcycleFormPage from './AdminMotorcycleFormPage';
import { renderWithProviders, screen, waitFor, within } from '../testing/test-utils';
import { mockApi } from '../testing/mockApi';
import { buildMotorcycle, buildSession, seedStoredSession } from '../testing/fixtures';

/**
 * Create and edit run through the same page, so both are driven here end to end:
 * real `MotorcycleForm`, real `ImageUploader`, real `toPayload`, faked HTTP only.
 */

const LANGUAGE_KEY = 'motorcycle-comparator.language';

beforeEach(() => {
  window.localStorage.setItem(LANGUAGE_KEY, 'en');
  // jsdom implements neither, and the form scrolls to its error banner while the
  // uploader previews a not-yet-uploaded file from an object URL.
  window.scrollTo = vi.fn();
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  }
});

afterEach(() => {
  mockApi.reset();
});

function seedSession(overrides) {
  return seedStoredSession(buildSession(overrides));
}

/** The whole admin area, so a redirect after saving lands somewhere real. */
function renderFormPage(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<p>admin dashboard stub</p>} />
      <Route path="/admin/motorcycles/new" element={<AdminMotorcycleFormPage />} />
      <Route path="/admin/motorcycles/:id" element={<AdminMotorcycleFormPage />} />
    </Routes>,
    { route },
  );
}

/** `ImageUploader`'s file input is intentionally unlabelled and visually hidden. */
function fileInput() {
  return document.querySelector('input[type="file"]');
}

function pngFile(name = 'bike.png') {
  return new File(['binary'], name, { type: 'image/png' });
}

async function fillRequiredFields(user) {
  await user.type(screen.getByRole('textbox', { name: 'Brand' }), 'Yamaha');
  await user.type(screen.getByRole('textbox', { name: 'Model' }), 'MT-07');
  await user.type(screen.getByRole('spinbutton', { name: 'Model year' }), '2024');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'NAKED');
}

describe('AdminMotorcycleFormPage authentication gate', () => {
  it('shows the login form instead of the create form to an anonymous visitor', () => {
    renderFormPage('/admin/motorcycles/new');

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create motorcycle' })).not.toBeInTheDocument();
  });

  it('shows the login form instead of the edit form to a non-admin account', () => {
    seedSession({ roles: ['ROLE_EDITOR'] });

    renderFormPage('/admin/motorcycles/1');

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(mockApi.history.get).toHaveLength(0);
  });
});

describe('AdminMotorcycleFormPage create', () => {
  beforeEach(() => {
    seedSession();
  });

  it('opens an empty create form without fetching anything', () => {
    renderFormPage('/admin/motorcycles/new');

    expect(screen.getByRole('heading', { name: 'New motorcycle' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Brand' })).toHaveValue('');
    expect(mockApi.history.get).toHaveLength(0);
  });

  it('does not warn about full replacement, which only applies to an edit', () => {
    renderFormPage('/admin/motorcycles/new');

    expect(
      screen.queryByText('Saving replaces the whole record — a field left blank is cleared.'),
    ).not.toBeInTheDocument();
  });

  it('blocks the request and names the missing fields when nothing is filled in', async () => {
    const user = userEvent.setup({ delay: null });
    renderFormPage('/admin/motorcycles/new');

    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(await screen.findByText('Brand is required')).toBeInTheDocument();
    expect(screen.getByText('Model is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Model year is required')).toBeInTheDocument();
    expect(mockApi.history.post).toHaveLength(0);
  });

  it('rejects a model year outside the range the API accepts', async () => {
    const user = userEvent.setup({ delay: null });
    renderFormPage('/admin/motorcycles/new');

    await user.type(screen.getByRole('textbox', { name: 'Brand' }), 'Yamaha');
    await user.type(screen.getByRole('textbox', { name: 'Model' }), 'MT-07');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'NAKED');
    await user.type(screen.getByRole('spinbutton', { name: 'Model year' }), '1600');
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(await screen.findByText('Model year must be between 1885 and 2100')).toBeInTheDocument();
    expect(mockApi.history.post).toHaveLength(0);
  });

  it('sends blank optional inputs as null rather than empty strings or zeroes', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByText('admin dashboard stub');
    const payload = JSON.parse(mockApi.history.post[0].data);
    expect(payload).toMatchObject({ brand: 'Yamaha', model: 'MT-07', modelYear: 2024, category: 'NAKED' });
    expect(payload.priceEur).toBeNull();
    expect(payload.description).toBeNull();
    expect(payload.frameType).toBeNull();
  });

  it('always sends the engine block, which is @NotNull upstream', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByText('admin dashboard stub');
    const payload = JSON.parse(mockApi.history.post[0].data);
    expect(payload.engine).toEqual(expect.objectContaining({ displacementCc: null, gears: null }));
  });

  it('sends a wholly blank dimension block as null so the API can drop the row', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByText('admin dashboard stub');
    expect(JSON.parse(mockApi.history.post[0].data).dimension).toBeNull();
  });

  it('sends the dimension block once any of its measurements is filled in', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.type(screen.getByRole('spinbutton', { name: /Seat height/ }), '805');
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByText('admin dashboard stub');
    const payload = JSON.parse(mockApi.history.post[0].data);
    expect(payload.dimension).toMatchObject({ seatHeightMm: 805, kerbWeightKg: null });
  });

  it('returns to the dashboard once the motorcycle is created', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(await screen.findByText('admin dashboard stub')).toBeInTheDocument();
  });

  it('keeps the form and lists the field violations the API returned', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(400, {
      message: 'Validation failed',
      violations: [{ field: 'engine.gears', message: 'must be greater than 0' }],
      path: '/api/v1/motorcycles',
    });

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Validation failed')).toBeInTheDocument();
    expect(within(alert).getByText('engine.gears')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New motorcycle' })).toBeInTheDocument();
  });

  it('marks the offending input from a server violation', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(400, {
      message: 'Validation failed',
      violations: [{ field: 'brand', message: 'must not be blank' }],
    });

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('textbox', { name: 'Brand' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('holds a chosen image back until the motorcycle exists, then uploads it', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));
    mockApi.onPost('/motorcycles/9/image').reply(200, buildMotorcycle({ id: 9, imageUrl: '/i/9.png' }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.upload(fileInput(), pngFile());

    expect(await screen.findByText('This image is uploaded once the motorcycle has been created.')).toBeInTheDocument();
    expect(mockApi.history.post).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await screen.findByText('admin dashboard stub');
    expect(mockApi.history.post.map((entry) => entry.url)).toEqual(['/motorcycles', '/motorcycles/9/image']);
  });

  it('redirects to the saved record when only the image upload failed', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onPost('/motorcycles').reply(201, buildMotorcycle({ id: 9 }));
    mockApi.onPost('/motorcycles/9/image').reply(413, { message: 'Image is too large' });
    mockApi.onGet('/motorcycles/9').reply(200, buildMotorcycle({ id: 9 }));

    renderFormPage('/admin/motorcycles/new');
    await fillRequiredFields(user);
    await user.upload(fileInput(), pngFile());
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    // The motorcycle exists, so the admin is taken to it rather than back to a
    // dashboard that would read as "nothing was saved".
    expect(await screen.findByRole('heading', { name: 'Edit motorcycle' })).toBeInTheDocument();
    await waitFor(() => expect(mockApi.history.get.at(-1).url).toBe('/motorcycles/9'));

    // FormScreen is keyed by id specifically so this navigation remounts it and its
    // lazy `useState` re-reads `location.state.imageError` — regression coverage for
    // that: without the key, React reuses the create-form instance and this banner
    // never appears.
    expect(
      await screen.findByText('The motorcycle was created, but its image failed to upload: Image is too large'),
    ).toBeInTheDocument();
  });
});

describe('AdminMotorcycleFormPage edit', () => {
  beforeEach(() => {
    seedSession();
  });

  it('shows a loading state while the record is fetched', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');

    expect(screen.getByText('Loading motorcycle')).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Edit motorcycle' });
  });

  it('prefills the form from the fetched record', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');

    await screen.findByRole('heading', { name: 'Edit motorcycle' });
    expect(screen.getByRole('textbox', { name: 'Brand' })).toHaveValue('Yamaha');
    expect(screen.getByRole('spinbutton', { name: 'Model year' })).toHaveValue(2024);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('NAKED');
  });

  it('leaves an unpublished field blank rather than showing a zero', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ priceEur: null }));

    renderFormPage('/admin/motorcycles/1');

    await screen.findByRole('heading', { name: 'Edit motorcycle' });
    expect(screen.getByRole('spinbutton', { name: /Price/ })).toHaveValue(null);
  });

  it('warns that saving replaces the whole record', async () => {
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');

    expect(
      await screen.findByText('Saving replaces the whole record — a field left blank is cleared.'),
    ).toBeInTheDocument();
  });

  it('PUTs the complete record, not just what changed', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: '/i/1.png' }));
    mockApi.onPut('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.clear(screen.getByRole('textbox', { name: 'Model' }));
    await user.type(screen.getByRole('textbox', { name: 'Model' }), 'MT-09');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('admin dashboard stub');
    const payload = JSON.parse(mockApi.history.put[0].data);
    expect(payload.model).toBe('MT-09');
    expect(payload.brand).toBe('Yamaha');
    expect(payload.engine.displacementCc).toBe(689);
    expect(payload.dimension.wheelbaseMm).toBe(1400);
    expect(payload.additionalSpecs).toEqual({ Warranty: '2 years' });
    // Carried through untouched: a full replacement that omitted it would clear the upload.
    expect(payload.imageUrl).toBe('/i/1.png');
  });

  it('clears a field the admin blanked, as full replacement implies', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());
    mockApi.onPut('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.clear(screen.getByRole('textbox', { name: 'Frame type' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('admin dashboard stub');
    expect(JSON.parse(mockApi.history.put[0].data).frameType).toBeNull();
  });

  it('replaces the form with an error when the record cannot be loaded', async () => {
    mockApi.onGet('/motorcycles/404').reply(404, { message: 'Motorcycle 404 was not found' });

    renderFormPage('/admin/motorcycles/404');

    expect(await screen.findByRole('alert')).toHaveTextContent('Motorcycle 404 was not found');
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to administration' })).toBeInTheDocument();
  });

  it('keeps the admin on the form when the save is rejected', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle());
    mockApi.onPut('/motorcycles/1').reply(409, { message: 'Slug already in use' });

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Slug already in use');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});

describe('AdminMotorcycleFormPage image endpoints', () => {
  beforeEach(() => {
    seedSession();
  });

  it('uploads immediately when editing and adopts the URL the API issued', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: null }));
    mockApi
      .onPost('/motorcycles/1/image')
      .reply(200, buildMotorcycle({ imageUrl: '/api/v1/images/motorcycles/1.png' }));

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.upload(fileInput(), pngFile());

    const preview = await screen.findByRole('img', { name: 'Selected motorcycle' });
    expect(preview).toHaveAttribute('src', 'http://localhost:8080/api/v1/images/motorcycles/1.png');
  });

  it('sends the upload as multipart form data carrying the chosen file', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: null }));
    mockApi.onPost('/motorcycles/1/image').reply(200, buildMotorcycle({ imageUrl: '/i/1.png' }));

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.upload(fileInput(), pngFile());

    await waitFor(() => expect(mockApi.history.post).toHaveLength(1));
    const request = mockApi.history.post[0];
    expect(request.data).toBeInstanceOf(FormData);
    expect(request.data.get('file')).toBeInstanceOf(File);
  });

  it('carries a freshly uploaded image into the next full-replacement save', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: null }));
    mockApi.onPost('/motorcycles/1/image').reply(200, buildMotorcycle({ imageUrl: '/i/new.png' }));
    mockApi.onPut('/motorcycles/1').reply(200, buildMotorcycle());

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.upload(fileInput(), pngFile());
    await screen.findByRole('img', { name: 'Selected motorcycle' });
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('admin dashboard stub');
    expect(JSON.parse(mockApi.history.put[0].data).imageUrl).toBe('/i/new.png');
  });

  it('reports an upload the API refused', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: null }));
    mockApi.onPost('/motorcycles/1/image').reply(415, { message: 'Unsupported media type' });

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.upload(fileInput(), pngFile());

    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported media type');
  });

  it('removes the stored image through the dedicated endpoint', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: '/i/1.png' }));
    mockApi.onDelete('/motorcycles/1/image').reply(200, buildMotorcycle({ imageUrl: null }));

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });
    expect(screen.getByRole('img', { name: 'Selected motorcycle' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(screen.queryByRole('img', { name: 'Selected motorcycle' })).not.toBeInTheDocument());
    expect(mockApi.history.delete[0].url).toBe('/motorcycles/1/image');
  });

  it('reports a failed image removal', async () => {
    const user = userEvent.setup({ delay: null });
    mockApi.onGet('/motorcycles/1').reply(200, buildMotorcycle({ imageUrl: '/i/1.png' }));
    mockApi.onDelete('/motorcycles/1/image').reply(500, { message: 'Storage is unavailable' });

    renderFormPage('/admin/motorcycles/1');
    await screen.findByRole('heading', { name: 'Edit motorcycle' });

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Storage is unavailable');
  });
});
