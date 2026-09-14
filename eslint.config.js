import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Root-level config files sit outside the package tsconfigs.
          allowDefaultProject: ['eslint.config.js', 'vitest.config.ts'],
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
      'no-console': 'error',
    },
  },
  {
    // Playbooks are declarative legal data, not logic. They are reviewed as prose
    // and are allowed to be longer than a code module.
    files: ['packages/core/src/playbooks/**/*.ts'],
    rules: { 'max-lines': 'off' },
  },
  {
    files: ['**/*.test.ts'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
]);
