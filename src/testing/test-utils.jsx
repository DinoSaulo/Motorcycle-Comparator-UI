import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import { LanguageProvider } from '../hooks/useLanguage';

// Renders UI wrapped in LanguageProvider, AuthProvider, and MemoryRouter for testing.
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
