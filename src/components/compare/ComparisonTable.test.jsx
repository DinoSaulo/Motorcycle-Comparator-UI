import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '../../testing/test-utils';
import { buildComparison, buildMotorcycle } from '../../testing/fixtures';
import ComparisonTable from './ComparisonTable';

const honda = buildMotorcycle({
  id: 2,
  brand: 'Honda',
  model: 'CB650R',
  category: 'SPORT',
  priceEur: 9199,
  engine: { displacementCc: 649, maxPowerHp: 94 },
});

function comparisonOf(motorcycles) {
  return buildComparison(motorcycles);
}

describe('ComparisonTable', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('captions the table with the number of motorcycles compared', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);

    expect(
      screen.getByRole('table', { name: 'Side-by-side specification comparison of 2 motorcycles' }),
    ).toBeInTheDocument();
  });

  it('heads one column per motorcycle, with its name, category, year and price', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);

    expect(screen.getByText('Yamaha MT-07')).toBeInTheDocument();
    expect(screen.getByText('Honda CB650R')).toBeInTheDocument();
    expect(screen.getByText('Naked · 2024')).toBeInTheDocument();
    expect(screen.getByText('€9,199')).toBeInTheDocument();
  });

  it('renders the fixed specification column header', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);
    expect(screen.getByRole('columnheader', { name: 'Specification' })).toBeInTheDocument();
  });

  it('renders each group heading and its rows in the order the API returned them', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);

    expect(screen.getByRole('rowheader', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Model year' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Max power/ })).toBeInTheDocument();
  });

  it('shows the resolved photo when one is published', () => {
    const withImage = buildMotorcycle({ imageUrl: '/uploads/mt-07.jpg' });
    renderWithProviders(<ComparisonTable comparison={comparisonOf([withImage, honda])} />);

    expect(screen.getByRole('img', { name: 'Yamaha MT-07' })).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/mt-07.jpg'),
    );
  });

  it('falls back to a decorative placeholder when a motorcycle has no photo', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('counts the specifications that are identical across every column', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);
    // Category and max power differ between these two; only the model year matches.
    expect(screen.getByText(/1 identical specifications/)).toBeInTheDocument();
  });

  it('omits the identical count when every row differs', () => {
    const comparison = comparisonOf([buildMotorcycle(), honda]);
    for (const group of comparison.groups) {
      for (const row of group.rows) row.differing = true;
    }

    renderWithProviders(<ComparisonTable comparison={comparison} />);

    expect(screen.queryByText(/identical specifications/)).not.toBeInTheDocument();
  });

  it('hides the rows the API flagged as identical once the filter is on', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);

    await user.click(screen.getByRole('checkbox', { name: 'Show differences only' }));

    expect(screen.queryByRole('rowheader', { name: 'Model year' })).not.toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Max power/ })).toBeInTheDocument();
  });

  it('drops a group whose rows were all filtered out, leaving no orphan heading', async () => {
    const user = userEvent.setup();
    const comparison = comparisonOf([buildMotorcycle(), honda]);
    // The engine group's only row is the differing one; blank it out so the group empties.
    comparison.groups[1].rows[0].differing = false;
    comparison.groups[0].rows[0].differing = true;

    renderWithProviders(<ComparisonTable comparison={comparison} />);
    await user.click(screen.getByRole('checkbox'));

    expect(screen.queryByText('Engine')).not.toBeInTheDocument();
  });

  it('explains an empty result when nothing differs at all', async () => {
    const user = userEvent.setup();
    const comparison = comparisonOf([buildMotorcycle(), honda]);
    for (const group of comparison.groups) {
      for (const row of group.rows) row.differing = false;
    }

    renderWithProviders(<ComparisonTable comparison={comparison} />);
    await user.click(screen.getByRole('checkbox'));

    expect(
      screen.getByText('These motorcycles have identical published specifications.'),
    ).toBeInTheDocument();
  });

  it('restores every row when the filter is switched back off', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    await user.click(checkbox);

    expect(screen.getByRole('rowheader', { name: 'Model year' })).toBeInTheDocument();
  });

  it('offers a labelled remove control per column when the parent accepts removals', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} onRemove={onRemove} />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Honda CB650R from comparison' }));

    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('omits the remove controls when no handler is supplied', () => {
    renderWithProviders(<ComparisonTable comparison={comparisonOf([buildMotorcycle(), honda])} />);
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
  });

  it('scales to the maximum of four columns', () => {
    const four = [
      buildMotorcycle(),
      honda,
      buildMotorcycle({ id: 3, brand: 'KTM', model: '790 Duke' }),
      buildMotorcycle({ id: 4, brand: 'Suzuki', model: 'SV650' }),
    ];

    renderWithProviders(<ComparisonTable comparison={comparisonOf(four)} />);

    const headerRow = screen.getAllByRole('row')[0];
    // One fixed specification column plus one per motorcycle.
    expect(within(headerRow).getAllByRole('columnheader')).toHaveLength(5);
  });
});
