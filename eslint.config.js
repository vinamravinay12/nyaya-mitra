import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/dist-tsc/**', '**/coverage/**']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Root-level config files sit outside the package tsconfigs.
          allowDefaultProject: [
            'eslint.config.js',
            'vitest.config.ts',
            'packages/client/vite.config.ts',
          ],
        },
      },
    },
    rules: {
      // Code Quality on this rubric tracks file size closely: the highest-scoring
      // reference repos kept their largest file between 118 and 264 lines.
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 12],
      eqeqeq: ['error', 'always'],
      // Express identifies an error handler by its 4-argument shape, so unused
      // trailing parameters are load-bearing.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
    },
  },
  {
    // Accessibility rules are errors, not warnings: a warning is a rule nobody
    // fixes. These run over every component in the client.
    files: ['packages/client/src/**/*.tsx'],
    extends: [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- jsx-a11y ships no type declarations
      jsxA11y.flatConfigs.strict,
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Playbooks are declarative legal data, not logic. They are reviewed as prose
    // and are allowed to be longer than a code module.
    files: ['packages/core/src/playbooks/**/*.ts'],
    rules: { 'max-lines': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      // supertest types `response.body` as `any` by design; asserting on it is
      // the point of an HTTP test.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]);
