import { defineConfig } from 'vitest/config';

// Separate from vite.config.js so tests don't load the PWA / Tailwind plugins.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['tests/**/*.test.js'],
  },
});
