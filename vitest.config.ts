import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Count every source file, not only the ones a test happened to import.
      // Without this an untested module is simply absent from the denominator.
      all: true,
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/core/src/**/*.ts'],
      // `types/` holds type-only declarations that emit no runtime code, so they
      // have nothing to execute. Everything with behaviour stays in the report.
      exclude: ['**/*.test.ts', '**/types/**'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
