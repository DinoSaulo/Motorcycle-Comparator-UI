import { describe, expect, it, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../testing/test-utils';
import LanguageSwitcher from './LanguageSwitcher';

const LANGUAGE_KEY = 'motorcycle-comparator.language';

function trigger() {
  return screen.getByRole('button', { name: 'Language' });
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    window.localStorage.setItem(LANGUAGE_KEY, 'en');
  });

  it('shows the active language on a collapsed listbox trigger', () => {
    renderWithProviders(<LanguageSwitcher />);

    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveTextContent('English');
  });

  it('opens the listbox on click and marks the active language as selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Português', 'English']);
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Português' })).toHaveAttribute('aria-selected', 'false');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes again when the trigger is pressed a second time', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.click(trigger());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('switches the language when an option is chosen and persists the choice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Português' }));

    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('pt');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('returns focus to the trigger after a selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Português' }));

    await waitFor(() => expect(screen.getByRole('button')).toHaveFocus());
  });

  it('opens pre-focused on the current language from the arrow keys', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    trigger().focus();
    await user.keyboard('{ArrowDown}');

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'English' }).id,
    );
  });

  it('opens from ArrowUp as well', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    trigger().focus();
    await user.keyboard('{ArrowUp}');

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('ignores unrelated keys on the trigger', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    trigger().focus();
    await user.keyboard('a');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wraps the highlight around the ends with the arrow keys', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    const listbox = screen.getByRole('listbox');
    const portuguese = screen.getByRole('option', { name: 'Português' });
    const english = screen.getByRole('option', { name: 'English' });

    // Opens on English (index 1); one step down wraps to the first entry.
    await user.keyboard('{ArrowDown}');
    expect(listbox).toHaveAttribute('aria-activedescendant', portuguese.id);

    await user.keyboard('{ArrowUp}');
    expect(listbox).toHaveAttribute('aria-activedescendant', english.id);
  });

  it('jumps to the first and last entries with Home and End', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    const listbox = screen.getByRole('listbox');

    await user.keyboard('{Home}');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Português' }).id,
    );

    await user.keyboard('{End}');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'English' }).id,
    );
  });

  it('commits the highlighted entry with Enter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.keyboard('{Home}{Enter}');

    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('pt');
  });

  it('commits the highlighted entry with Space', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.keyboard('{Home}[Space]');

    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('pt');
  });

  it('closes on Escape without changing the language', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('en');
  });

  it('closes when Tab moves focus on', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.keyboard('{Tab}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('highlights whichever entry the pointer is over', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.hover(screen.getByRole('option', { name: 'Português' }));

    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Português' }).id,
    );
  });

  it('closes when focus leaves the control entirely', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LanguageSwitcher />
        <button type="button">Outside</button>
      </>,
    );

    await user.click(trigger());
    screen.getByRole('button', { name: 'Outside' }).focus();

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('ignores keys with no listbox meaning', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(trigger());
    await user.keyboard('x');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
