import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Reuses one jsdom per worker instead of building it for every file.
    pool: 'vmThreads',
    setupFiles: './vitest.setup.ts',
    globals: true,
    // Component tests drive whole forms through user-event, which is slow on
    // some machines.
    testTimeout: 15_000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './') },
  },
});