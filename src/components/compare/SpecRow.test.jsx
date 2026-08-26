import { describe, expect, it, beforeEach } from 'vitest';
import { renderWithProviders, screen, within } from '../../testing/test-utils';
import { EMPTY_VALUE } from '../../utils/formatters';
import SpecRow from './SpecRow';

function renderRow(row, columnCount = 2) {
  return renderWithProviders(
    <table>
      <tbody>
        <SpecRow row={row} columnCount={columnCount} />
      </tbody>
    </table>,
  );
}

function cells() {
  return within(screen.getByRole('row')).getAllByRole('cell');
}

describe('SpecRow', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('renders the label the API decided on as the row header', () => {
    renderRow({ label: 'Max power', unit: 'hp', values: [73.4, 94], winnerIndexes: [1] });
    expect(screen.getByRole('rowheader')).toHaveTextContent('Max power');
  });

  it('appends the unit supplied by the API', () => {
    renderRow({ label: 'Max power', unit: 'hp', values: [73.4, 94], winnerIndexes: [] });
    expect(screen.getByRole('rowheader')).toHaveTextContent('(hp)');
  });

  it('omits the unit segment for a unitless spec', () => {
    renderRow({ label: 'Final drive', unit: null, values: ['Chain', 'Chain'], winnerIndexes: [] });
    expect(screen.getByRole('rowheader')).toHaveTextContent('Final drive');
    expect(screen.getByRole('rowheader').textContent).not.toContain('(');
  });

  it('renders one cell per compared motorcycle', () => {
    renderRow({ label: 'Gears', unit: null, values: [6, 6, 6], winnerIndexes: [] }, 3);
    expect(cells()).toHaveLength(3);
  });

  it('renders the values in the order the API returned them', () => {
    renderRow({ label: 'Gears', unit: null, values: [6, 5], winnerIndexes: [] });

    const [first, second] = cells();
    expect(first).toHaveTextContent('6');
    expect(second).toHaveTextContent('5');
  });

  it('renders an em dash for a null value rather than a zero', () => {
    renderRow({ label: 'Dry weight', unit: 'kg', values: [null, 184], winnerIndexes: [] });

    const [first, second] = cells();
    expect(first).toHaveTextContent(EMPTY_VALUE);
    expect(second).toHaveTextContent('184');
  });

  it('treats undefined and empty strings as unpublished too', () => {
    renderRow({ label: 'ABS type', unit: null, values: [undefined, ''], winnerIndexes: [] });

    for (const cell of cells()) {
      expect(cell).toHaveTextContent(EMPTY_VALUE);
    }
  });

  it('fills the missing columns when the API sent fewer values than columns', () => {
    renderRow({ label: 'Gears', unit: null, values: [6], winnerIndexes: [] }, 3);

    const rendered = cells();
    expect(rendered).toHaveLength(3);
    expect(rendered[1]).toHaveTextContent(EMPTY_VALUE);
    expect(rendered[2]).toHaveTextContent(EMPTY_VALUE);
  });

  it('tolerates a row with no values array', () => {
    renderRow({ label: 'Gears', unit: null, winnerIndexes: [] });
    expect(cells()[0]).toHaveTextContent(EMPTY_VALUE);
  });

  it('pairs the winner highlight with text, so colour never carries it alone', () => {
    renderRow({ label: 'Max power', unit: 'hp', values: [73.4, 94], winnerIndexes: [1] });

    const [loser, winner] = cells();
    expect(within(winner).getByText('Best value')).toBeInTheDocument();
    expect(within(loser).queryByText('Best value')).not.toBeInTheDocument();
  });

  it('marks several winners when the API declared a tie between some columns', () => {
    renderRow({ label: 'Max power', unit: 'hp', values: [94, 94, 73.4], winnerIndexes: [0, 1] }, 3);
    expect(screen.getAllByText('Best value')).toHaveLength(2);
  });

  it('drops the highlight entirely when every column would win', () => {
    renderRow({ label: 'Gears', unit: null, values: [6, 6], winnerIndexes: [0, 1] });
    expect(screen.queryByText('Best value')).not.toBeInTheDocument();
  });

  it('shows no winner when the spec is not rankable', () => {
    renderRow({ label: 'Frame type', unit: null, values: ['Steel', 'Alloy'], winnerIndexes: [] });
    expect(screen.queryByText('Best value')).not.toBeInTheDocument();
  });

  it('tolerates a row with no winnerIndexes property', () => {
    renderRow({ label: 'Frame type', unit: null, values: ['Steel', 'Alloy'] });
    expect(screen.queryByText('Best value')).not.toBeInTheDocument();
  });

  it('formats the category row, the one spec whose values are raw enum codes', () => {
    renderRow({ label: 'Category', unit: null, values: ['OFF_ROAD', 'NAKED'], winnerIndexes: [] });

    const [first, second] = cells();
    expect(first).toHaveTextContent('Off Road');
    expect(second).toHaveTextContent('Naked');
  });

  it('translates the label against the active language', () => {
    window.localStorage.setItem('motorcycle-comparator.language', 'pt');
    renderRow({ label: 'Model year', unit: null, values: [2024, 2023], winnerIndexes: [] });

    expect(screen.getByRole('rowheader')).not.toHaveTextContent('Model year');
  });
});
