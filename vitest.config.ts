import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/{core,server}/src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['packages/client/src/**/*.test.{ts,tsx}'],
          setupFiles: ['./packages/client/src/test-utils/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      // Count every source file, not only the ones a test happened to import.
      // Without this an untested module is simply absent from the denominator.
      all: true,
      reporter: ['text', 'html', 'lcov'],
      include: [
        'packages/core/src/**/*.ts',
        'packages/server/src/**/*.ts',
        'packages/client/src/**/*.{ts,tsx}',
      ],
      // `index.ts` in the server is the process entry point and `main.tsx` in the
      // client is the DOM bootstrap: both bind to the outside world and are
      // exercised by running the app. Everything they wire up is tested directly.
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/types/**',
        'packages/server/src/index.ts',
        'packages/client/src/main.tsx',
        // Fixtures and the axe helper are test infrastructure, exercised by the
        // tests that import them rather than being product code themselves.
        '**/test-utils/**',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
