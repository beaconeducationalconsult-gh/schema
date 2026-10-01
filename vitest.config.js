import { defineConfig } from 'vitest/config';

// Separate from vite.config.js so tests don't load the PWA / Tailwind plugins.
// Component tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
