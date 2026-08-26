import { describe, expect, it, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { buildSession } from '../../testing/fixtures';
import Navbar from './Navbar';

const SESSION_KEY = 'motorcycle-comparator.session';

function signIn(session = buildSession()) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

describe('Navbar', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('is exposed as a labelled navigation landmark', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('links the wordmark back to the catalogue root', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: /Motorcycle Comparator/ })).toHaveAttribute('href', '/');
  });

  it('offers the catalogue and comparison destinations', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Catalogue' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
  });

  it('hides the admin destination from an anonymous visitor', () => {
    renderWithProviders(<Navbar />);
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('surfaces the admin destination to a signed-in administrator', () => {
    signIn();
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  it('keeps the admin destination hidden for a signed-in non-admin', () => {
    signIn(buildSession({ roles: ['ROLE_EDITOR'] }));
    renderWithProviders(<Navbar />);

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('marks the destination matching the current route as current', () => {
    renderWithProviders(<Navbar />, { route: '/compare' });

    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Catalogue' })).not.toHaveAttribute('aria-current');
  });

  it('includes the language switcher', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('button', { name: 'Language' })).toBeInTheDocument();
  });
});
