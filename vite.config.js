import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 5173 is one of the origins the API's CORS configuration already trusts,
    // so the browser talks to http://localhost:8080 directly with no proxy.
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testing/setupTests.js'],
    css: true,
    restoreMocks: true,
    // A handful of admin-form integration tests drive several fields with real,
    // char-by-char `userEvent.type()` across multiple mocked network round trips;
    // the 5s default is occasionally too tight for that, independent of the app.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/testing/**',
        'src/**/*.test.{js,jsx}',
        'src/i18n/translations/**',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
