import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../testing/test-utils';
import { buildSession } from '../../testing/fixtures';
import { ApiRequestError, getStoredToken } from '../../services/api';
import { login } from '../../services/authService';
import LoginForm from './LoginForm';

// Only the network call is faked; session storage and role checks stay real.
vi.mock('../../services/authService', async (importOriginal) => ({
  ...(await importOriginal()),
  login: vi.fn(),
}));

async function fillAndSubmit(user, { username = 'admin', password = 'secret' } = {}) {
  await user.type(screen.getByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
    login.mockResolvedValue(buildSession());
  });

  it('presents a titled credential form', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('sends the typed credentials to the auth service', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user, { username: 'admin', password: 'letmein' });

    expect(login).toHaveBeenCalledWith({ username: 'admin', password: 'letmein' });
  });

  it('leaves no error behind after a successful admin sign-in', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('empties the password field once the attempt resolves', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    await waitFor(() => expect(screen.getByLabelText('Password')).toHaveValue(''));
    expect(screen.getByLabelText('Username')).toHaveValue('admin');
  });

  it('rejects a valid account that is not an administrator', async () => {
    login.mockResolvedValue(buildSession({ roles: ['ROLE_EDITOR'] }));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account does not have administrator permissions.',
    );
  });

  it('drops the token of a non-admin rather than leaving it armed', async () => {
    login.mockResolvedValue(buildSession({ roles: ['ROLE_EDITOR'] }));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    await screen.findByRole('alert');
    expect(getStoredToken()).toBeNull();
  });

  it('treats a session with no roles at all as a failure', async () => {
    login.mockResolvedValue(buildSession({ roles: undefined }));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account does not have administrator permissions.',
    );
  });

  it('surfaces the API error when the credentials are refused', async () => {
    login.mockRejectedValue(
      new ApiRequestError({ message: 'Invalid username or password.', status: 401 }),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
  });

  it('clears a previous error when the next attempt starts', async () => {
    login.mockRejectedValueOnce(new ApiRequestError({ message: 'Invalid credentials', status: 401 }));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);
    await screen.findByRole('alert');

    login.mockResolvedValue(buildSession());
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('locks the submit button and announces progress while the request is in flight', async () => {
    let resolveLogin;
    login.mockReturnValue(new Promise((resolve) => {
      resolveLogin = resolve;
    }));
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await fillAndSubmit(user);

    const button = screen.getByRole('button', { name: /Signing in/ });
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Signing in');

    resolveLogin(buildSession());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
  });
});
