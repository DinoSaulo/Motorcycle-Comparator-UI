import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../testing/test-utils';
import AdminStatsPage from './AdminStatsPage';

describe('AdminStatsPage Accessibility', () => {
  describe('Authentication and page structure', () => {
    it('renders login form with proper heading when not authenticated', () => {
      renderWithProviders(<AdminStatsPage />);

      // Page should render with authentication check
      // If not authenticated, login form is shown
      const loginHeading = screen.getByRole('heading', { name: /login|admin/i });
      expect(loginHeading).toBeInTheDocument();
    });

    it('login form has accessible form elements', () => {
      renderWithProviders(<AdminStatsPage />);

      // Find form inputs by their associated labels
      const usernameInput = screen.getByLabelText(/usuário|username|user/i);
      const passwordInput = screen.getByLabelText(/senha|password/i);
      const submitButton = screen.getByRole('button', { name: /entrar|login/i });

      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('login form has semantic HTML structure', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      // Should contain a form element
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();

      // Form should have labeled inputs
      const labels = container.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('login form inputs have proper autocomplete attributes', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const usernameInput = container.querySelector('input[type="text"]');
      const passwordInput = container.querySelector('input[type="password"]');

      expect(usernameInput?.getAttribute('autocomplete')).toBe('username');
      expect(passwordInput?.getAttribute('autocomplete')).toBe('current-password');
    });

    it('form button is a proper submit button', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const button = container.querySelector('form button');
      expect(button?.getAttribute('type')).toBe('submit');
    });

    it('login form has accessible visual hierarchy', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      // Should have h1 for main heading
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toMatch(/login|admin/i);
    });

    it('login form inputs are properly labeled', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const labels = container.querySelectorAll('label');
      const inputs = container.querySelectorAll('input');

      // Should have matching label for for each input
      expect(labels.length).toBe(inputs.length);

      inputs.forEach((input) => {
        const labelFor = input.getAttribute('id');
        if (labelFor) {
          const label = container.querySelector(`label[for="${labelFor}"]`);
          expect(label).toBeInTheDocument();
        }
      });
    });

    it('form has no color-only indicators', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const form = container.querySelector('form');
      const labels = form?.querySelectorAll('label');

      // Labels should have text content, not just color
      labels?.forEach((label) => {
        expect(label.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    it('form elements have sufficient spacing for accessibility', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      // Should have spacing classes for readability
      const form = container.querySelector('form');
      expect(form?.className).toMatch(/space-y|gap/);
    });

    it('dark mode classes are applied for contrast', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      // Should have dark mode text color classes
      const darkModeElements = container.querySelectorAll('[class*="dark:text"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Focus and keyboard navigation', () => {
    it('form inputs are keyboard accessible', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const usernameInput = container.querySelector('input[type="text"]');
      const passwordInput = container.querySelector('input[type="password"]');

      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();

      // Should be able to focus on these elements
      usernameInput?.focus();
      expect(document.activeElement).toBe(usernameInput);
    });

    it('submit button is keyboard accessible', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const button = container.querySelector('form button');
      expect(button).toBeInTheDocument();

      button?.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Screen reader support', () => {
    it('form has no accessibility issues with required attributes', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const usernameInput = container.querySelector('input[type="text"]');
      const passwordInput = container.querySelector('input[type="password"]');

      // Inputs should be marked as required
      expect(usernameInput?.hasAttribute('required')).toBe(true);
      expect(passwordInput?.hasAttribute('required')).toBe(true);
    });

    it('form inputs have text content for screen readers', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const inputs = container.querySelectorAll('input');
      const labels = container.querySelectorAll('label');

      // Each input should have an associated label
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        if (id) {
          const label = Array.from(labels).find((l) => l.getAttribute('for') === id);
          expect(label).toBeTruthy();
        }
      });
    });
  });

  describe('Semantic structure', () => {
    it('page has main container div for content', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      // Should have main content container
      const mainDiv = container.querySelector('[class*="max-w"]');
      expect(mainDiv).toBeInTheDocument();
    });

    it('inputs have appropriate type attributes', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const textInput = container.querySelector('input[type="text"]');
      const passwordInput = container.querySelector('input[type="password"]');

      expect(textInput?.getAttribute('type')).toBe('text');
      expect(passwordInput?.getAttribute('type')).toBe('password');
    });

    it('form uses appropriate input maxlength attributes', () => {
      const { container } = renderWithProviders(<AdminStatsPage />);

      const usernameInput = container.querySelector('input[type="text"]');
      const passwordInput = container.querySelector('input[type="password"]');

      // Should have reasonable length limits
      expect(usernameInput?.getAttribute('maxlength')).toBeTruthy();
      expect(passwordInput?.getAttribute('maxlength')).toBeTruthy();
    });
  });
});
