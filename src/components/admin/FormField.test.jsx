import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { CATEGORIES } from '../../services/motorcycleService';
import FormField from './FormField';

const textField = {
  name: 'brand',
  label: 'Brand',
  labelKey: 'fields.brand',
  type: 'text',
  required: true,
  maxLength: 60,
};

const integerField = {
  name: 'displacementCc',
  label: 'Displacement',
  labelKey: 'fields.displacementCc',
  type: 'integer',
  unit: 'cc',
  min: 1,
  max: 3000,
};

const decimalField = {
  name: 'maxPowerHp',
  label: 'Max power',
  labelKey: 'fields.maxPowerHp',
  type: 'decimal',
  unit: 'hp',
  min: 0,
};

const selectField = {
  name: 'category',
  label: 'Category',
  labelKey: 'fields.category',
  type: 'select',
  required: true,
  options: CATEGORIES,
};

const textareaField = {
  name: 'description',
  label: 'Description',
  labelKey: 'fields.description',
  type: 'textarea',
  maxLength: 2000,
  full: true,
};

function renderField(field, props = {}) {
  return renderWithProviders(
    <FormField
      field={field}
      value={props.value ?? ''}
      error={props.error}
      disabled={props.disabled}
      onChange={props.onChange ?? vi.fn()}
    />,
  );
}

describe('FormField', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('labels the control with the translated field name', () => {
    renderField(textField);
    expect(screen.getByLabelText(/Brand/)).toBeInTheDocument();
  });

  it('shows the unit next to the label when the descriptor declares one', () => {
    renderField(integerField);
    expect(screen.getByText('(cc)')).toBeInTheDocument();
  });

  it('marks a required field with an asterisk that is hidden from screen readers', () => {
    renderField(textField);

    const asterisk = screen.getByText('*');
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByLabelText(/Brand/)).toBeRequired();
  });

  it('leaves an optional field unmarked', () => {
    renderField(decimalField);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Max power/)).not.toBeRequired();
  });

  it('renders a text input bounded by the API length constraint', () => {
    renderField(textField, { value: 'Yamaha' });

    const control = screen.getByLabelText(/Brand/);
    expect(control).toHaveValue('Yamaha');
    expect(control).toHaveAttribute('type', 'text');
    expect(control).toHaveAttribute('maxLength', '60');
  });

  it('renders an integer input that steps by one so spinners cannot produce a fraction', () => {
    renderField(integerField, { value: '689' });

    const control = screen.getByLabelText(/Displacement/);
    expect(control).toHaveAttribute('type', 'number');
    expect(control).toHaveAttribute('step', '1');
    expect(control).toHaveAttribute('inputmode', 'numeric');
    expect(control).toHaveAttribute('min', '1');
    expect(control).toHaveAttribute('max', '3000');
  });

  it('renders a decimal input that accepts any step', () => {
    renderField(decimalField, { value: '73.4' });

    const control = screen.getByLabelText(/Max power/);
    expect(control).toHaveAttribute('step', 'any');
    expect(control).toHaveAttribute('inputmode', 'decimal');
  });

  it('renders a textarea for long free text', () => {
    renderField(textareaField, { value: 'A punchy middleweight naked bike.' });

    const control = screen.getByLabelText(/Description/);
    expect(control.tagName).toBe('TEXTAREA');
    expect(control).toHaveAttribute('maxLength', '2000');
  });

  it('renders a select with a blank prompt plus one localised option per category', () => {
    renderField(selectField);

    const control = screen.getByLabelText(/Category/);
    expect(screen.getAllByRole('option')).toHaveLength(CATEGORIES.length + 1);
    expect(screen.getByRole('option', { name: 'Select…' })).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Off Road' })).toHaveValue('OFF_ROAD');
    expect(control).toHaveValue('');
  });

  it('reports edits as a field name and its raw string value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderField(textField, { onChange });
    await user.type(screen.getByLabelText(/Brand/), 'Y');

    expect(onChange).toHaveBeenCalledWith('brand', 'Y');
  });

  it('reports a chosen option from a select', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderField(selectField, { onChange });
    await user.selectOptions(screen.getByLabelText(/Category/), 'NAKED');

    expect(onChange).toHaveBeenCalledWith('category', 'NAKED');
  });

  it('keeps the control controlled when handed no value at all', () => {
    renderField(textField, { value: undefined });
    expect(screen.getByLabelText(/Brand/)).toHaveValue('');
  });

  it('wires the error message to the control it belongs to', () => {
    renderField(textField, { error: 'Brand is required' });

    const control = screen.getByLabelText(/Brand/);
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Brand is required');
  });

  it('leaves a valid control unmarked and undescribed', () => {
    renderField(textField);

    const control = screen.getByLabelText(/Brand/);
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).not.toHaveAttribute('aria-describedby');
  });

  it('disables the control while the form is submitting', () => {
    renderField(textField, { disabled: true });
    expect(screen.getByLabelText(/Brand/)).toBeDisabled();
  });
});
