import { describe, it, expect } from 'vitest';
import { render, screen } from '../../testing/test-utils';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Motorcycles" value="142" />);

    expect(screen.getByText('Total Motorcycles')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
  });

  it('renders em dash when value is null', () => {
    render(<StatCard label="Last Updated" value={null} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders em dash when value is undefined', () => {
    render(<StatCard label="Price" value={undefined} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('label is in uppercase for visual hierarchy', () => {
      render(<StatCard label="Total Motorcycles" value="142" />);

      const label = screen.getByText('Total Motorcycles');
      expect(label).toHaveClass('uppercase');
    });

    it('value is bold for high contrast', () => {
      render(<StatCard label="Total Motorcycles" value="142" />);

      const value = screen.getByText('142');
      expect(value).toHaveClass('font-bold');
    });

    it('provides accessible context for screen readers via text content', () => {
      const { container } = render(<StatCard label="Total Motorcycles" value="142" />);

      // The card structure allows screen readers to read label and value in order
      const card = container.querySelector('[class*="rounded"]');
      const text = card?.textContent || '';
      expect(text).toContain('Total Motorcycles');
      expect(text).toContain('142');
    });

    it('em dash for null values is in labeled context', () => {
      const { container } = render(<StatCard label="Last Updated" value={null} />);

      // Em dash should be findable with its label
      const card = container.querySelector('[class*="rounded"]');
      const text = card?.textContent || '';
      expect(text).toContain('Last Updated');
      expect(text).toContain('—');
    });

    it('does not rely on color alone to convey information', () => {
      render(<StatCard label="Total Motorcycles" value="142" />);

      const label = screen.getByText('Total Motorcycles');
      const value = screen.getByText('142');

      // Both should have text styling, not just color
      expect(label).toHaveClass('uppercase');
      expect(value).toHaveClass('font-bold', 'text-2xl');
    });

    it('has sufficient whitespace and padding for readability', () => {
      const { container } = render(<StatCard label="Total Motorcycles" value="142" />);

      const card = container.querySelector('[class*="rounded"]');
      expect(card).toHaveClass('p-4');
    });

    it('dark mode text is still readable', () => {
      render(<StatCard label="Total Motorcycles" value="142" />);

      const value = screen.getByText('142');
      // Value should have dark mode text class for contrast
      expect(value.className).toMatch(/dark:text-white/);
    });

    it('structure allows semantic reading order', () => {
      const { container } = render(<StatCard label="Total Motorcycles" value="142" />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);

      // First p is label, second is value
      expect(paragraphs[0]).toHaveClass('uppercase');
      expect(paragraphs[1]).toHaveClass('font-bold');
    });
  });
});
