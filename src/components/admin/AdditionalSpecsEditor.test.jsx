import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { ADDITIONAL_SPECS_MAX } from '../../utils/motorcycleForm';
import AdditionalSpecsEditor from './AdditionalSpecsEditor';

function renderEditor(props = {}) {
  return renderWithProviders(
    <AdditionalSpecsEditor
      entries={props.entries ?? []}
      error={props.error}
      disabled={props.disabled}
      onChange={props.onChange ?? vi.fn()}
    />,
  );
}

describe('AdditionalSpecsEditor', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('starts with no rows and reports the budget as unused', () => {
    renderEditor();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(`0 of ${ADDITIONAL_SPECS_MAX} used.`)).toBeInTheDocument();
  });

  it('labels each row by its position so the pairs stay distinguishable', () => {
    renderEditor({ entries: [{ key: 'Warranty', value: '2 years' }] });

    expect(screen.getByLabelText('Specification 1 name')).toHaveValue('Warranty');
    expect(screen.getByLabelText('Specification 1 value')).toHaveValue('2 years');
  });

  it('keeps rows that momentarily share a key, since they are an ordered list', () => {
    renderEditor({
      entries: [
        { key: 'Warranty', value: '2 years' },
        { key: 'Warranty', value: '3 years' },
      ],
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByLabelText('Specification 2 value')).toHaveValue('3 years');
  });

  it('appends an empty row from the add action', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderEditor({ entries: [{ key: 'Warranty', value: '2 years' }], onChange });
    await user.click(screen.getByRole('button', { name: 'Add specification' }));

    expect(onChange).toHaveBeenCalledWith([
      { key: 'Warranty', value: '2 years' },
      { key: '', value: '' },
    ]);
  });

  it('patches only the edited row when a name is typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const entries = [
      { key: '', value: '' },
      { key: 'Colours', value: 'Blue' },
    ];

    renderEditor({ entries, onChange });
    await user.type(screen.getByLabelText('Specification 1 name'), 'W');

    expect(onChange).toHaveBeenCalledWith([{ key: 'W', value: '' }, entries[1]]);
  });

  it('patches only the edited row when a value is typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const entries = [{ key: 'Warranty', value: '' }];

    renderEditor({ entries, onChange });
    await user.type(screen.getByLabelText('Specification 1 value'), '2');

    expect(onChange).toHaveBeenCalledWith([{ key: 'Warranty', value: '2' }]);
  });

  it('removes the row its labelled delete action belongs to', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const entries = [
      { key: 'Warranty', value: '2 years' },
      { key: 'Colours', value: 'Blue' },
    ];

    renderEditor({ entries, onChange });
    await user.click(screen.getByRole('button', { name: 'Remove specification 1' }));

    expect(onChange).toHaveBeenCalledWith([entries[1]]);
  });

  it('counts the rows in use against the API maximum', () => {
    renderEditor({ entries: [{ key: 'a', value: '1' }, { key: 'b', value: '2' }] });
    expect(screen.getByText(`2 of ${ADDITIONAL_SPECS_MAX} used.`)).toBeInTheDocument();
  });

  it('stops offering new rows once the maximum is reached', () => {
    const entries = Array.from({ length: ADDITIONAL_SPECS_MAX }, (_, index) => ({
      key: `spec-${index}`,
      value: String(index),
    }));

    renderEditor({ entries });

    expect(screen.getByRole('button', { name: 'Add specification' })).toBeDisabled();
  });

  it('disables every control while the form is submitting', () => {
    renderEditor({ entries: [{ key: 'Warranty', value: '2 years' }], disabled: true });

    expect(screen.getByLabelText('Specification 1 name')).toBeDisabled();
    expect(screen.getByLabelText('Specification 1 value')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove specification 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add specification' })).toBeDisabled();
  });

  it('announces a validation problem as an alert', () => {
    renderEditor({ error: 'Every additional specification needs a name' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Every additional specification needs a name',
    );
  });

  it('shows no alert while the block is valid', () => {
    renderEditor({ entries: [{ key: 'Warranty', value: '2 years' }] });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
