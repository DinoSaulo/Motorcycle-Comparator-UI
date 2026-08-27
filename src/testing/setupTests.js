import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { setStoredToken } from '../services/api';

// jsdom has no real storage persistence guarantees across tests; start every test from a
// clean slate so language/session state never leaks between specs. The bearer token is no
// longer in Web Storage at all (SEC-001) — it is a module-level variable, and a module
// registry is shared by every spec in a file, so it has to be cleared explicitly or the
// first test to sign in leaves every later one authenticated.
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  setStoredToken(null);
});

afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia, and Navbar/LanguageSwitcher-adjacent code
// (or any future Tailwind-driven responsive check) may probe it.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom does not implement scrollIntoView / scrollTo, used by autocomplete/table
// keyboard navigation.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
