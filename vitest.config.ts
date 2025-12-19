import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./**/*.{test,spec}.ts?'],
    exclude: ['libs/ui/*'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',

      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 70,
      },
    },
  },
});
