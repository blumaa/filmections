import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mond-design-system/theme'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false, // Don't process CSS in tests
    server: {
      deps: {
        inline: ['@mond-design-system/theme'],
      },
    },
  },
});
