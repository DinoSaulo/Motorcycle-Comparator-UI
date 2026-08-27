import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { setStoredToken } from '../services/api';

// Clears local/session storage and reset memory bearer tokens before each test run.
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
