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
});
