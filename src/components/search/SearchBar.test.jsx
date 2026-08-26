import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '../../testing/test-utils';
import { buildMotorcycle } from '../../testing/fixtures';
import { useMotorcycles } from '../../hooks/useMotorcycles';
import SearchBar from './SearchBar';

// The hook is covered by its own spec; here it only has to feed the combobox.
vi.mock('../../hooks/useMotorcycles', () => ({ useMotorcycles: vi.fn() }));

const suggestions = [
  buildMotorcycle(),
  buildMotorcycle({ id: 2, brand: 'Honda', model: 'CB650R' }),
];

function setResults({ motorcycles = suggestions, loading = false } = {}) {
  useMotorcycles.mockReturnValue({ motorcycles, loading });
}

function input() {
  return screen.getByRole('searchbox', { name: 'Search motorcycles' });
}

/** The real 300 ms debounce is left running; this waits it out. */
function afterDebounce() {
  return act(() => new Promise((resolve) => setTimeout(resolve, 350)));
}

describe('SearchBar', () => {
  let user;

  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
    user = userEvent.setup();
    setResults();
  });

  it('labels the input and offers the translated placeholder', () => {
    renderWithProviders(<SearchBar />);

    expect(input()).toHaveAttribute('placeholder', 'Search by brand, model or slug…');
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('accepts a caller-supplied placeholder', () => {
    renderWithProviders(<SearchBar placeholder="Search for a motorcycle…" />);
    expect(input()).toHaveAttribute('placeholder', 'Search for a motorcycle…');
  });

  it('takes focus on mount when asked to', () => {
    renderWithProviders(<SearchBar autoFocus />);
    expect(input()).toHaveFocus();
  });

  it('exposes a collapsed combobox while nothing has been typed', () => {
    renderWithProviders(<SearchBar />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not query the API until something has been typed', () => {
    renderWithProviders(<SearchBar />);
    expect(useMotorcycles).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('reports the debounced term to its parent', async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<SearchBar onQueryChange={onQueryChange} />);

    await user.type(input(), 'mt');

    await waitFor(() => expect(onQueryChange).toHaveBeenLastCalledWith('mt'));
  });

  it('trims the term and stops at the 100 characters the API accepts', async () => {
    const onQueryChange = vi.fn();
    renderWithProviders(<SearchBar onQueryChange={onQueryChange} />);

    fireEvent.change(input(), { target: { value: `  ${'a'.repeat(120)}  ` } });

    await waitFor(() => expect(onQueryChange).toHaveBeenLastCalledWith('a'.repeat(100)));
  });

  it('opens the suggestion listbox once a debounced term exists', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('announces the number of suggestions without stealing focus', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');

    expect(screen.getByRole('status')).toHaveTextContent('2 suggestions available');
    expect(input()).toHaveFocus();
  });

  it('uses the singular announcement for a lone suggestion', async () => {
    setResults({ motorcycles: [suggestions[0]] });
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');

    expect(screen.getByRole('status')).toHaveTextContent('1 suggestion available');
  });

  it('stays quiet while results are still loading', async () => {
    setResults({ motorcycles: [], loading: true });
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');

    expect(screen.queryByText(/suggestions? available/)).not.toBeInTheDocument();
  });

  it('walks the suggestions with the arrow keys via aria-activedescendant', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    const [first, second] = screen.getAllByRole('option');

    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant', first.id);

    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant', second.id);

    // Past the end, the highlight wraps back to the top.
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant', first.id);
  });

  it('wraps to the last suggestion when arrowing up from nothing', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(input()).toHaveAttribute('aria-activedescendant', options[1].id);
  });

  it('commits the highlighted suggestion with Enter and empties the field', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<SearchBar onSelect={onSelect} />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);
    expect(input()).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ignores Enter while no suggestion is highlighted', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<SearchBar onSelect={onSelect} />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{Enter}');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('commits a suggestion chosen with the pointer', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<SearchBar onSelect={onSelect} />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.click(screen.getAllByRole('option')[1]);

    expect(onSelect).toHaveBeenCalledWith(suggestions[1]);
  });

  it('closes the listbox on Escape while keeping the typed term', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).toHaveValue('mt');
  });

  it('reopens the closed listbox with ArrowDown', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}{ArrowDown}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('leaves the closed listbox alone for keys other than ArrowDown', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}{ArrowUp}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears the field from the clear button and returns focus to it', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
    // Refocusing reopens the combobox, so the list only goes once the debounce catches up.
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('keeps typing working while the listbox is open', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    await user.keyboard('0');

    expect(input()).toHaveValue('mt0');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('offers no clear button while the field is empty', () => {
    renderWithProviders(<SearchBar />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('keeps the listbox closed while the field only holds whitespace', async () => {
    renderWithProviders(<SearchBar />);

    await user.type(input(), '   ');
    await afterDebounce();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the listbox when the field loses focus', async () => {
    renderWithProviders(
      <>
        <SearchBar />
        <button type="button">Elsewhere</button>
      </>,
    );

    await user.type(input(), 'mt');
    await screen.findByRole('listbox');
    act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
