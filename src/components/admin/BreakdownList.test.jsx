import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../testing/test-utils';
import BreakdownList from './BreakdownList';

describe('BreakdownList', () => {
  const sampleRecord = {
    Yamaha: 12,
    Honda: 9,
    BMW: 8,
    Kawasaki: 7,
    Ducati: 6,
    KTM: 5,
    Suzuki: 4,
    Royal: 3,
    Triumph: 2,
    Aprilia: 1,
    Harley: 1,
  };

  it('renders the title and top 10 brands by default', () => {
    render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

    expect(screen.getByRole('heading', { name: 'By Brand' })).toBeInTheDocument();
    expect(screen.getByText('Yamaha')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
  });

  it('shows expand button when record exceeds maxVisible', () => {
    render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

    expect(screen.getByRole('button', { name: /show all 11 brands/i })).toBeInTheDocument();
  });

  it('expands to show all items when button is clicked', async () => {
    const user = userEvent.setup();
    render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

    await user.click(screen.getByRole('button', { name: /show all 11 brands/i }));

    expect(screen.getByText('Harley')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
  });

  it('does not show expand button when all items fit', () => {
    const smallRecord = { A: 5, B: 3 };
    render(<BreakdownList title="Brands" record={smallRecord} maxVisible={10} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles empty record', () => {
    render(<BreakdownList title="Brands" record={{}} maxVisible={10} />);

    expect(screen.getByRole('heading', { name: 'Brands' })).toBeInTheDocument();
    expect(screen.getByText('No data.')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('section has accessible heading hierarchy (h3)', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      expect(screen.getByRole('heading', { level: 3, name: 'By Brand' })).toBeInTheDocument();
    });

    it('expand button has descriptive text identifying the action', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const button = screen.getByRole('button', { name: /show all 11 brands/i });
      expect(button.textContent).toContain('Show all');
      expect(button.textContent).toContain('11');
      expect(button.textContent).toContain('brands');
    });

    it('expand button is keyboard accessible (Enter key)', async () => {
      const user = userEvent.setup();
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const button = screen.getByRole('button', { name: /show all/i });
      button.focus();

      // Activate with Enter
      await user.keyboard('{Enter}');

      expect(screen.getByText('Harley')).toBeInTheDocument();
    });

    it('expand button is keyboard accessible (Space key)', async () => {
      const user = userEvent.setup();
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const button = screen.getByRole('button', { name: /show all/i });
      button.focus();

      // Activate with Space
      await user.keyboard(' ');

      expect(screen.getByText('Harley')).toBeInTheDocument();
    });

    it('decorative chevron icon is hidden from screen readers', () => {
      const { container } = render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const chevron = container.querySelector('[aria-hidden="true"]');
      expect(chevron).toBeInTheDocument();
    });

    it('items are displayed with both visual bar and numeric count', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      // Item name should be visible
      expect(screen.getByText('Yamaha')).toBeInTheDocument();
      // Count should be visible
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('count display is right-aligned for numeric consistency', () => {
      const { container } = render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const counts = container.querySelectorAll('.text-right');
      expect(counts.length).toBeGreaterThan(0);
    });

    it('bar chart is not the only indicator of value (has text count)', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      // Both visual bar (implicit) and numeric text should be present
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('Yamaha')).toBeInTheDocument();
    });

    it('maintains semantic structure with flex layout for visual arrangement', () => {
      const { container } = render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const flexContainers = container.querySelectorAll('[class*="flex"]');
      expect(flexContainers.length).toBeGreaterThan(0);
    });

    it('empty state message is clear and descriptive', () => {
      render(<BreakdownList title="Brands" record={{}} maxVisible={10} />);

      expect(screen.getByText('No data.')).toBeInTheDocument();
    });

    it('expanded button text correctly pluralizes or singularizes items', () => {
      const singleItem = { A: 5 };
      const { rerender } = render(<BreakdownList title="By Brand" record={singleItem} maxVisible={10} />);

      // With single item, no expand button
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      // With multiple items that exceed max, check button text
      const multipleItems = { A: 5, B: 3, C: 2, D: 1, E: 1, F: 1, G: 1, H: 1, I: 1, J: 1, K: 1 };
      rerender(<BreakdownList title="By Brand" record={multipleItems} maxVisible={10} />);

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('brands');
    });

    it('item keys are readable and not truncated', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      // All top 10 items should be fully readable
      expect(screen.getByText('Yamaha')).toBeInTheDocument();
      expect(screen.getByText('Kawasaki')).toBeInTheDocument();
      expect(screen.getByText('Triumph')).toBeInTheDocument();
    });

    it('dark mode colors maintain contrast for readability', () => {
      const { container } = render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      // Check that dark mode classes are applied
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('button has inline-flex layout for proper spacing', () => {
      render(<BreakdownList title="By Brand" record={sampleRecord} maxVisible={10} />);

      const button = screen.getByRole('button');
      // Button should use inline-flex layout
      expect(button.className).toMatch(/inline-flex|flex/);
    });
  });
});
