import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom has no real localStorage persistence guarantees across tests; start every
// test from a clean slate so language/session/token state never leaks between specs.
beforeEach(() => {
  window.localStorage.clear();
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
