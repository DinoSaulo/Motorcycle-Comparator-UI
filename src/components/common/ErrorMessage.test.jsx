import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { buildApiError } from '../../testing/fixtures';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('renders nothing when there is no error', () => {
    const { container } = renderWithProviders(<ErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the API message through an alert', () => {
    renderWithProviders(<ErrorMessage error={buildApiError({ message: 'The request failed.' })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('The request failed.');
  });

  it('lists each field violation so the user knows which input was rejected', () => {
    const error = buildApiError({
      violations: [
        { field: 'brand', message: 'must not be blank' },
        { field: 'engine.gears', message: 'must be positive' },
      ],
    });

    renderWithProviders(<ErrorMessage error={error} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('brand: must not be blank');
    expect(items[1]).toHaveTextContent('engine.gears: must be positive');
  });

  it('omits the violation list when the error carries none', () => {
    renderWithProviders(<ErrorMessage error={buildApiError()} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('tolerates an error whose violations property is missing entirely', () => {
    renderWithProviders(<ErrorMessage error={{ message: 'Boom' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('offers a retry action and reports the click', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<ErrorMessage error={buildApiError()} onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry action when no handler is supplied', () => {
    renderWithProviders(<ErrorMessage error={buildApiError()} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('hides the retry action for an error the client already knows is not retryable', () => {
    const error = { ...buildApiError({ status: 404 }), isRetryable: false };
    renderWithProviders(<ErrorMessage error={error} onRetry={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
