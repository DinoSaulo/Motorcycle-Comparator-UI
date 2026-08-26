import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import AddMotorcycleCard from './AddMotorcycleCard';

describe('AddMotorcycleCard', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('is a real button so it is reachable by keyboard', () => {
    renderWithProviders(<AddMotorcycleCard onClick={vi.fn()} remaining={0} />);
    expect(screen.getByRole('button', { name: /Add motorcycle/ })).toBeInTheDocument();
  });

  it('reports a press', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddMotorcycleCard onClick={onClick} remaining={2} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('spells out the remaining slots in the singular for the last one', () => {
    renderWithProviders(<AddMotorcycleCard onClick={vi.fn()} remaining={1} />);
    expect(screen.getByText('1 slot left')).toBeInTheDocument();
  });

  it('uses the plural wording for several remaining slots', () => {
    renderWithProviders(<AddMotorcycleCard onClick={vi.fn()} remaining={3} />);
    expect(screen.getByText('3 slots left')).toBeInTheDocument();
  });

  it('says nothing about slots when the comparison is already full', () => {
    renderWithProviders(<AddMotorcycleCard onClick={vi.fn()} remaining={0} />);
    expect(screen.queryByText(/slot/)).not.toBeInTheDocument();
  });

  it('omits the slot hint when the count is not supplied at all', () => {
    renderWithProviders(<AddMotorcycleCard onClick={vi.fn()} />);
    expect(screen.queryByText(/slot/)).not.toBeInTheDocument();
  });

  it('can be disabled once no slot is left', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddMotorcycleCard onClick={onClick} disabled remaining={0} />);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
