import { describe, expect, it, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '../../testing/test-utils';
import Footer from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('is exposed as a contentinfo landmark', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('shows the tagline and the data provenance notice', () => {
    renderWithProviders(<Footer />);

    expect(
      screen.getByText('Motorcycle Comparator — specifications for reference only.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Motorcycle Comparator API')).toBeInTheDocument();
  });

  it('follows the active language', () => {
    window.localStorage.setItem('motorcycle-comparator.language', 'pt');
    renderWithProviders(<Footer />);

    expect(
      screen.queryByText('Motorcycle Comparator — specifications for reference only.'),
    ).not.toBeInTheDocument();
  });
});
