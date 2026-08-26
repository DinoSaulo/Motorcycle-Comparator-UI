import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import { LanguageProvider } from '../hooks/useLanguage';

/**
 * Every screen in this app sits under a router and both context providers, so
 * component/integration tests render through this wrapper instead of the bare
 * `render()` from `@testing-library/react` — matching the real provider tree in
 * `App.jsx` and `AppRoutes.jsx`.
 *
 * `route`/`initialEntries` seed the router history; pass `initialEntries` directly
 * when a test needs more than one history entry (e.g. to assert on `navigate(-1)`).
 */
export function renderWithProviders(
  ui,
  { route = '/', initialEntries = [route], ...renderOptions } = {},
) {
  function Wrapper({ children }) {
    return (
      <LanguageProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthProvider>
      </LanguageProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export so specs only need one import for the common RTL surface.
export * from '@testing-library/react';
