import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { setStoredToken } from '../services/api';

// Setup global test fixtures with storage cleanup and token reset.
// Called at import time by vitest's globals mode.
(() => {
  // Defer hook registration until test context is ready
  if (typeof beforeEach !== 'undefined') {
    beforeEach(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      setStoredToken(null);
    });

    afterEach(() => {
      cleanup();
    });
  }
})();

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
