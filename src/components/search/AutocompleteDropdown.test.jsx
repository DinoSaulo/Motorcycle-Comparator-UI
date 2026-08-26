import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { buildMotorcycle } from '../../testing/fixtures';
import { EMPTY_VALUE } from '../../utils/formatters';
import AutocompleteDropdown from './AutocompleteDropdown';

const options = [
  buildMotorcycle(),
  buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R', category: 'SPORT', modelYear: 2023 }),
];

function renderDropdown(props = {}) {
  return renderWithProviders(
    <AutocompleteDropdown
      id="suggestions"
      options={props.options ?? options}
      activeIndex={props.activeIndex ?? -1}
      loading={props.loading ?? false}
      query={props.query ?? 'mt'}
      onSelect={props.onSelect ?? vi.fn()}
      optionId={(index) => `suggestions-option-${index}`}
    />,
  );
}

describe('AutocompleteDropdown', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('is a labelled listbox', () => {
    renderDropdown();
    expect(screen.getByRole('listbox', { name: 'Motorcycle suggestions' })).toBeInTheDocument();
  });

  it('renders one option per suggestion, with its name, category and year', () => {
    renderDropdown();

    const rendered = screen.getAllByRole('option');
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveTextContent('Yamaha MT-07');
    expect(rendered[0]).toHaveTextContent('Naked · 2024');
    expect(rendered[1]).toHaveTextContent('Honda CB650R');
  });

  it('shows the engine size alongside each suggestion', () => {
    renderDropdown();
    expect(screen.getAllByText('689 cc')).toHaveLength(2);
  });

  it('renders an em dash when a suggestion has no published displacement', () => {
    renderDropdown({ options: [buildMotorcycle({ engine: null })] });
    expect(screen.getByText(EMPTY_VALUE)).toBeInTheDocument();
  });

  it('marks only the highlighted row as selected', () => {
    renderDropdown({ activeIndex: 1 });

    const rendered = screen.getAllByRole('option');
    expect(rendered[0]).toHaveAttribute('aria-selected', 'false');
    expect(rendered[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('reports the chosen motorcycle to its parent', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderDropdown({ onSelect });
    await user.click(screen.getAllByRole('option')[1]);

    expect(onSelect).toHaveBeenCalledWith(options[1]);
  });

  it('shows a spinner while the first result set is still loading', () => {
    renderDropdown({ options: [], loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Searching');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('keeps the previous results visible while a newer search is in flight', () => {
    renderDropdown({ loading: true });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('quotes the query back when nothing matched', () => {
    renderDropdown({ options: [], query: 'zzz' });
    expect(screen.getByText('No motorcycles match “zzz”.')).toBeInTheDocument();
  });
});
