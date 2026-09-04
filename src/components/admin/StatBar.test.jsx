import { describe, it, expect } from 'vitest';
import { render, screen } from '../../testing/test-utils';
import StatBar from './StatBar';

describe('StatBar', () => {
  it('renders label, percentage, and count', () => {
    render(<StatBar label="Engine specs" ratio={0.95} count={5} />);

    expect(screen.getByText('Engine specs')).toBeInTheDocument();
    // All these are in a single span, split across text nodes
    expect(screen.getByText((content) => content.includes('95%') && content.includes('5'))).toBeInTheDocument();
  });

  it('renders em dash for null ratio', () => {
    render(<StatBar label="Price" ratio={null} count={22} />);

    // Em dash and count are in a single span, split across text nodes
    expect(screen.getByText((content) => content.includes('—') && content.includes('22'))).toBeInTheDocument();
  });

  it('scales the bar width to the ratio', () => {
    const { container } = render(<StatBar label="Test" ratio={0.5} count={10} />);
    const bar = container.querySelector('[data-testid="stat-bar-fill"]');

    expect(bar).toHaveStyle('width: 50%');
  });

  it('handles edge case ratio 0', () => {
    render(<StatBar label="Test" ratio={0} count={100} />);
    expect(screen.getByText((content) => content.includes('0%'))).toBeInTheDocument();
  });

  it('handles edge case ratio 1', () => {
    render(<StatBar label="Test" ratio={1} count={0} />);
    expect(screen.getByText((content) => content.includes('100%'))).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has progressbar role with required ARIA attributes', () => {
      render(<StatBar label="Engine specs" ratio={0.95} count={5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('role', 'progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '95');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('sets aria-valuenow to 0 when ratio is null', () => {
      render(<StatBar label="Price" ratio={null} count={22} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('updates aria-valuenow based on ratio', () => {
      const { rerender } = render(<StatBar label="Test" ratio={0.5} count={10} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');

      rerender(<StatBar label="Test" ratio={0.75} count={10} />);
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('label is readable and descriptive', () => {
      render(<StatBar label="Engine Type Coverage" ratio={0.9} count={2} />);

      expect(screen.getByText('Engine Type Coverage')).toBeInTheDocument();
    });

    it('provides both visual bar and text percentage for meaning', () => {
      render(<StatBar label="Test Field" ratio={0.75} count={5} />);

      // Text should show percentage
      expect(screen.getByText((content) => content.includes('75%'))).toBeInTheDocument();

      // aria-valuenow should match
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('displays gap count with proper pluralization for screen readers', () => {
      const { rerender } = render(<StatBar label="Test" ratio={0.5} count={1} />);

      expect(screen.getByText((content) => content.includes('1 gap'))).toBeInTheDocument();

      rerender(<StatBar label="Test" ratio={0.5} count={5} />);
      expect(screen.getByText((content) => content.includes('5 gaps'))).toBeInTheDocument();
    });

    it('bar is distinguishable by color and width, not just width', () => {
      const { container } = render(<StatBar label="Test" ratio={0.5} count={10} />);

      const bar = container.querySelector('[data-testid="stat-bar-fill"]');
      // Should have accent color class
      expect(bar).toHaveClass('bg-accent-500');

      // Should have transition for smooth updates
      expect(bar).toHaveClass('transition-all');
    });

    it('background bar provides contrast for visual distinction', () => {
      const { container } = render(<StatBar label="Test" ratio={0.5} count={10} />);

      const backgroundBar = container.querySelector('[role="progressbar"]');
      expect(backgroundBar).toHaveClass('bg-zinc-200', 'dark:bg-zinc-700');
    });

    it('em dash for null ratio is in labeled context', () => {
      render(<StatBar label="Missing Data Field" ratio={null} count={22} />);

      const content = screen.getByText((text) => text.includes('—'));
      expect(content).toBeInTheDocument();

      // Label should be visible before the em dash
      expect(screen.getByText('Missing Data Field')).toBeInTheDocument();
    });

    it('structure uses semantic layout for readability', () => {
      const { container } = render(<StatBar label="Test" ratio={0.5} count={10} />);

      // Should have flex layout for horizontal alignment
      const flexContainer = container.querySelector('[class*="flex"]');
      expect(flexContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });
});
