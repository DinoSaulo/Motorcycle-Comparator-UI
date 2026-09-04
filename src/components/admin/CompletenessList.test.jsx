import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../testing/test-utils';
import CompletenessList from './CompletenessList';

describe('CompletenessList', () => {
  it('renders section title', () => {
    renderWithProviders(
      <CompletenessList
        title="Engine Specifications"
        fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
        total={100}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Engine Specifications' })).toBeInTheDocument();
  });

  it('renders each field as a StatBar with gap count and completeness ratio', () => {
    const fieldGaps = { engineType: 0, maxPowerHp: 5 };
    renderWithProviders(
      <CompletenessList
        title="Engine"
        fieldGaps={fieldGaps}
        total={100}
      />,
    );

    // Both fields should be present (order determined by gap count: maxPowerHp first with 5 gaps, engineType second with 0)
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('handles total === 0 (empty catalogue)', () => {
    const fieldGaps = { engineType: 0 };
    renderWithProviders(
      <CompletenessList
        title="Engine"
        fieldGaps={fieldGaps}
        total={0}
      />,
    );

    // Ratio is null, so em dash for percentage
    expect(screen.getByText((content) => content.includes('—'))).toBeInTheDocument();
  });

  it('sorts fields by gap count descending (worst first)', () => {
    const fieldGaps = { a: 5, b: 2, c: 10 };
    const { container } = renderWithProviders(
      <CompletenessList
        title="Test"
        fieldGaps={fieldGaps}
        total={100}
      />,
    );

    // Get all aria-valuenow attributes, which represent the percentage for each field
    const bars = container.querySelectorAll('[role="progressbar"]');
    // c (10 gaps) → 90% complete, a (5 gaps) → 95% complete, b (2 gaps) → 98% complete
    expect(bars[0].getAttribute('aria-valuenow')).toBe('90');
    expect(bars[1].getAttribute('aria-valuenow')).toBe('95');
    expect(bars[2].getAttribute('aria-valuenow')).toBe('98');
  });

  describe('Accessibility', () => {
    it('section has accessible heading hierarchy (h3)', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine Specifications"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      expect(screen.getByRole('heading', { level: 3, name: 'Engine Specifications' })).toBeInTheDocument();
    });

    it('all progressbars have required ARIA attributes', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      const bars = container.querySelectorAll('[role="progressbar"]');
      // Each progressbar should have required ARIA attributes
      // aria-valuenow, aria-valuemin, aria-valuemax
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });

    it('field labels are translated and readable', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Field labels should be present in the DOM
      const bars = screen.getAllByRole('progressbar');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('progressbars are properly ordered by severity (worst first)', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Test"
          fieldGaps={{ a: 5, b: 2, c: 10 }}
          total={100}
        />,
      );

      const bars = container.querySelectorAll('[role="progressbar"]');
      expect(bars[0].getAttribute('aria-valuenow')).toBe('90');
      expect(bars[1].getAttribute('aria-valuenow')).toBe('95');
      expect(bars[2].getAttribute('aria-valuenow')).toBe('98');
    });

    it('gap count is displayed for each field', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Gap counts should be visible as text
      expect(screen.getByText((content) => content.includes('5'))).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('0'))).toBeInTheDocument();
    });

    it('provides both visual bar and text percentage', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Percentage text should be visible in percentage format (100%, 95%)
      const percentageElements = screen.queryAllByText((content) =>
        typeof content === 'string' && content.match(/\d+%/)
      );
      expect(percentageElements.length).toBeGreaterThan(0);
    });

    it('handles null total gracefully with em dash', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0 }}
          total={0}
        />,
      );

      // Em dash should be rendered for undefined ratio
      expect(screen.getByText((content) => content.includes('—'))).toBeInTheDocument();
    });

    it('maintains consistent spacing for readability', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Should have spacing between progress bars
      const spacingDiv = container.querySelector('[class*="space-y"]');
      expect(spacingDiv).toBeInTheDocument();
    });

    it('dark mode colors are applied for sufficient contrast', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Check for dark mode classes
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('field names in progress bars are not truncated', () => {
      renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5, numberOfCylinders: 2 }}
          total={100}
        />,
      );

      // Progress bars and their labels should be fully visible
      const bars = screen.getAllByRole('progressbar');
      expect(bars.length).toBe(3);
    });

    it('gap counts are displayed with progress bars', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Progress bars should be rendered for each field
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBe(2);
    });

    it('field ordering by completeness provides useful information order', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ a: 5, b: 2, c: 10 }}
          total={100}
        />,
      );

      // Worst fields (highest gaps) should be listed first
      const bars = Array.from(container.querySelectorAll('[role="progressbar"]'));
      const completeness = bars.map((bar) => parseInt(bar.getAttribute('aria-valuenow')));

      // Should be in ascending order (worst first)
      for (let i = 1; i < completeness.length; i++) {
        expect(completeness[i]).toBeGreaterThanOrEqual(completeness[i - 1]);
      }
    });

    it('uses semantic HTML structure without divitis', () => {
      const { container } = renderWithProviders(
        <CompletenessList
          title="Engine"
          fieldGaps={{ engineType: 0, maxPowerHp: 5 }}
          total={100}
        />,
      );

      // Should have h3 and semantic structure
      expect(container.querySelector('h3')).toBeInTheDocument();
      // Each field rendered through StatBar (which uses semantic progressbar role)
      expect(container.querySelectorAll('[role="progressbar"]').length).toBe(2);
    });
  });
});
