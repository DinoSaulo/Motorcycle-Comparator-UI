import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../testing/test-utils';
import { buildApiError, buildMotorcycle } from '../../testing/fixtures';
import { emptyFormState, toFormState } from '../../utils/motorcycleForm';
import MotorcycleForm from './MotorcycleForm';

function renderForm(props = {}) {
  const state = props.state ?? emptyFormState();
  const onChange = props.onChange ?? vi.fn();
  const onSubmit = props.onSubmit ?? vi.fn();

  return {
    state,
    onChange,
    onSubmit,
    ...renderWithProviders(
      <MotorcycleForm
        state={state}
        onChange={onChange}
        onSubmit={onSubmit}
        onImageUpload={props.onImageUpload}
        onImageRemove={props.onImageRemove}
        onImageSelected={props.onImageSelected}
        submitting={props.submitting ?? false}
        imageBusy={props.imageBusy ?? false}
        error={props.error}
        submitLabel={props.submitLabel ?? 'Create motorcycle'}
      />,
    ),
  };
}

function validState() {
  return toFormState(buildMotorcycle());
}

describe('MotorcycleForm', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('groups the fields into the sections of the API record', () => {
    renderForm();

    for (const legend of ['Identity', 'Engine', 'Chassis & brakes', 'Dimensions & weight', 'Additional specifications']) {
      expect(screen.getByRole('group', { name: new RegExp(legend.replace('&', '&')) })).toBeInTheDocument();
    }
  });

  it('warns that saving replaces the dimension block wholesale', () => {
    renderForm();
    expect(
      screen.getByText('Leaving this block entirely blank clears any dimensions already stored.'),
    ).toBeInTheDocument();
  });

  it('renders the caller-supplied submit label', () => {
    renderForm({ submitLabel: 'Save changes' });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('fills every control from the state it was handed', () => {
    renderForm({ state: validState() });

    expect(screen.getByRole('textbox', { name: 'Brand' })).toHaveValue('Yamaha');
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveValue('MT-07');
    expect(screen.getByRole('spinbutton', { name: 'Displacement(cc)' })).toHaveValue(689);
    expect(screen.getByRole('spinbutton', { name: 'Kerb weight(kg)' })).toHaveValue(184);
  });

  it('reports a top-level edit as a whole new state object', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const state = emptyFormState();

    renderForm({ state, onChange });
    await user.type(screen.getByLabelText(/Brand/), 'K');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ brand: 'K' }));
  });

  it('nests an engine edit inside the engine block', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderForm({ onChange });
    await user.type(screen.getByLabelText(/Cylinders/), '2');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ engine: expect.objectContaining({ cylinders: '2' }) }),
    );
  });

  it('nests a dimension edit inside the dimension block', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderForm({ onChange });
    await user.type(screen.getByLabelText(/Wheelbase/), '1');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dimension: expect.objectContaining({ wheelbaseMm: '1' }) }),
    );
  });

  it('reports an additional specification row through the same state object', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderForm({ onChange });
    await user.click(screen.getByRole('button', { name: 'Add specification' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ additionalSpecs: [{ key: '', value: '' }] }),
    );
  });

  it('blocks submission and shows the local validation failures', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderForm({ onSubmit });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Brand is required')).toBeInTheDocument();
    expect(screen.getByText('Model is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Model year is required')).toBeInTheDocument();
  });

  it('takes the user straight to the first rejected input', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    await waitFor(() => expect(screen.getByLabelText(/Brand/)).toHaveFocus());
  });

  it('rejects a model year outside the range the API accepts', async () => {
    const user = userEvent.setup();
    const state = { ...validState(), modelYear: '1700' };

    renderForm({ state });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(screen.getByText('Model year must be between 1885 and 2100')).toBeInTheDocument();
  });

  it('submits the converted payload once the state is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderForm({ state: validState(), onSubmit });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      brand: 'Yamaha',
      model: 'MT-07',
      modelYear: 2024,
      category: 'NAKED',
      engine: expect.objectContaining({ displacementCc: 689 }),
      additionalSpecs: { Warranty: '2 years' },
    });
    // Blank optional inputs must reach the API as null, never as an empty string.
    expect(payload.engine.emissionStandard).toBe('Euro 5');
    expect(payload.dimension.dryWeightKg).toBeNull();
  });

  it('sends a null dimension block when none of its fields were filled in', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const state = { ...validState(), dimension: emptyFormState().dimension };

    renderForm({ state, onSubmit });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(onSubmit.mock.calls[0][0].dimension).toBeNull();
  });

  it('clears stale validation failures on the next valid submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderForm({ onSubmit });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));
    expect(screen.getByText('Brand is required')).toBeInTheDocument();

    rerender(
      <MotorcycleForm
        state={validState()}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        submitting={false}
        submitLabel="Create motorcycle"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(screen.queryByText('Brand is required')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders the request error above the form', () => {
    renderForm({ error: buildApiError({ message: 'The request failed.' }) });
    expect(screen.getByRole('alert')).toHaveTextContent('The request failed.');
  });

  it('attaches a server violation to the input its leaf field names', () => {
    const error = buildApiError({
      violations: [{ field: 'engine.gears', message: 'must be positive' }],
    });

    renderForm({ error });

    expect(screen.getByLabelText(/Gears/)).toHaveAccessibleDescription('must be positive');
  });

  it('lets a local failure win over a stale server violation on the same field', async () => {
    const user = userEvent.setup();
    const error = buildApiError({ violations: [{ field: 'brand', message: 'must not be blank' }] });

    renderForm({ error });
    await user.click(screen.getByRole('button', { name: 'Create motorcycle' }));

    expect(screen.getByLabelText(/Brand/)).toHaveAccessibleDescription('Brand is required');
  });

  it('locks the whole form while a save is in flight', () => {
    renderForm({ submitting: true });

    const submit = screen.getByRole('button', { name: /Saving/ });
    expect(submit).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
    expect(screen.getByLabelText(/Brand/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add specification' })).toBeDisabled();
  });

  it('passes the stored image through to the uploader', () => {
    const state = { ...emptyFormState(), imageUrl: '/uploads/mt-07.jpg' };
    renderForm({ state, onImageRemove: vi.fn() });

    expect(screen.getByRole('img', { name: 'Selected motorcycle' })).toBeInTheDocument();
  });

  it('reports image progress from the uploader', () => {
    renderForm({ imageBusy: true });
    expect(screen.getByRole('status')).toHaveTextContent('Uploading image');
  });
});
