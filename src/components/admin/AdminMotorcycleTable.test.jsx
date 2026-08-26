import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '../../testing/test-utils';
import { buildMotorcycle } from '../../testing/fixtures';
import { EMPTY_VALUE } from '../../utils/formatters';
import AdminMotorcycleTable from './AdminMotorcycleTable';

const motorcycles = [
  buildMotorcycle(),
  buildMotorcycle({
    id: 2,
    slug: 'honda-cb650r-2023',
    brand: 'Honda',
    model: 'CB650R',
    modelYear: 2023,
    category: 'SPORT',
    priceEur: 9199,
  }),
];

function renderTable(props = {}) {
  return renderWithProviders(
    <AdminMotorcycleTable
      motorcycles={props.motorcycles ?? motorcycles}
      onDelete={props.onDelete ?? vi.fn()}
      busyId={props.busyId}
    />,
  );
}

describe('AdminMotorcycleTable', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('heads every column of the catalogue listing', () => {
    renderTable();

    for (const label of ['Motorcycle', 'Category', 'Year', 'Engine', 'Price', 'Actions']) {
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument();
    }
  });

  it('renders one row per motorcycle', () => {
    renderTable();
    // One header row plus one per record.
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('shows the name, slug and formatted specifications of a record', () => {
    renderTable();

    const row = screen.getByRole('row', { name: /Yamaha MT-07/ });
    expect(within(row).getByText('Yamaha MT-07')).toBeInTheDocument();
    expect(within(row).getByText('yamaha-mt-07-2024')).toBeInTheDocument();
    expect(within(row).getByText('Naked')).toBeInTheDocument();
    expect(within(row).getByText('2024')).toBeInTheDocument();
    expect(within(row).getByText('689 cc')).toBeInTheDocument();
    expect(within(row).getByText('€8,299')).toBeInTheDocument();
  });

  it('renders an em dash for unpublished figures rather than a zero', () => {
    renderTable({ motorcycles: [buildMotorcycle({ priceEur: null, engine: null })] });

    expect(screen.getAllByText(EMPTY_VALUE)).toHaveLength(2);
  });

  it('renders the uploaded photo as decoration, since the name is already in the row', () => {
    renderTable({ motorcycles: [buildMotorcycle({ imageUrl: '/uploads/mt-07.jpg' })] });

    const image = screen.getByRole('presentation');
    expect(image).toHaveAttribute('src', expect.stringContaining('/uploads/mt-07.jpg'));
  });

  it('falls back to a placeholder when a record has no photo', () => {
    renderTable();
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('links each row to its own edit screen', () => {
    renderTable();

    expect(screen.getByRole('link', { name: 'Edit Honda CB650R' })).toHaveAttribute(
      'href',
      '/admin/motorcycles/2',
    );
  });

  it('reports the whole record when its delete action is used', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderTable({ onDelete });
    await user.click(screen.getByRole('button', { name: 'Delete Yamaha MT-07' }));

    expect(onDelete).toHaveBeenCalledWith(motorcycles[0]);
  });

  it('marks the row being deleted as busy and blocks a second press', () => {
    renderTable({ busyId: 1 });

    expect(screen.getByRole('button', { name: 'Delete Yamaha MT-07' })).toBeDisabled();
    expect(screen.getByRole('row', { name: /Yamaha MT-07/ })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Delete Honda CB650R' })).toBeEnabled();
  });

  it('renders an empty body when the page has no results', () => {
    renderTable({ motorcycles: [] });

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });
});
