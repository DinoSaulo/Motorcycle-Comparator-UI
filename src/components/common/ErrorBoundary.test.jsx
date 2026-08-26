import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import ErrorBoundary from './ErrorBoundary';

/** Throws on render until the flag is flipped, so a reset can be observed recovering. */
function Boom({ shouldThrow, message = 'Rendering blew up' }) {
  if (shouldThrow) throw new Error(message);
  return <p>Recovered content</p>;
}

describe('ErrorBoundary', () => {
  let consoleError;

  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
    // React logs the caught error and its component stack; that noise is expected here.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders its children while nothing throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <p>Healthy page</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Healthy page')).toBeInTheDocument();
  });

  it('swaps in the fallback UI when a child throws during render', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Rendering blew up')).toBeInTheDocument();
  });

  it('falls back to a generic explanation when the error carries no message', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow message="" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('An unexpected error interrupted this page.')).toBeInTheDocument();
  });

  it('reports the caught error so a real reporter can pick it up', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalledWith(
      'Unhandled rendering error',
      expect.any(Error),
      expect.anything(),
    );
  });

  it('clears the error and re-renders the children when reset', async () => {
    const user = userEvent.setup();

    const { rerender } = renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    // The child has to stop throwing before the retry, otherwise it just crashes again.
    rerender(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Something went wrong' })).not.toBeInTheDocument();
  });
});
