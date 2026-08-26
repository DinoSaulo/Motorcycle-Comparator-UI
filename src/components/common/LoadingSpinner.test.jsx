import { describe, expect, it, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '../../testing/test-utils';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('exposes a status role so assistive tech announces the wait', () => {
    renderWithProviders(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('falls back to the translated generic label when none is given', () => {
    renderWithProviders(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('announces a caller-supplied label instead of the generic one', () => {
    renderWithProviders(<LoadingSpinner label="Building comparison" />);
    expect(screen.getByRole('status')).toHaveTextContent('Building comparison');
  });

  it('renders at every supported size', () => {
    for (const size of ['sm', 'md', 'lg']) {
      const { unmount } = renderWithProviders(<LoadingSpinner size={size} label={`spinner-${size}`} />);
      expect(screen.getByRole('status')).toHaveTextContent(`spinner-${size}`);
      unmount();
    }
  });

  it('translates the default label with the active language', () => {
    window.localStorage.setItem('motorcycle-comparator.language', 'pt');
    renderWithProviders(<LoadingSpinner />);
    expect(screen.getByRole('status')).not.toHaveTextContent('Loading');
  });
});
