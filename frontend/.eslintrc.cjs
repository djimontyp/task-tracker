/**
 * ESLint Configuration for Pulse Radar Frontend
 *
 * Includes:
 * - React + TypeScript base rules
 * - Design System enforcement (no raw Tailwind colors)
 *
 * @see docs/design-system/README.md
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended', 'plugin:storybook/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'local-rules',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // ═══════════════════════════════════════════════════════════════
    // DESIGN SYSTEM ENFORCEMENT
    // ═══════════════════════════════════════════════════════════════

    // Local rule: Заборона raw Tailwind кольорів
    // Всі порушення виправлені — тепер error
    'local-rules/no-raw-tailwind-colors': ['error', {
      // HexColorPicker дозволяє raw кольори (це color picker)
      allowedPatterns: ['HexColorPicker'],
    }],

    // Local rule: 4px grid система (заборона непарних spacing)
    // Всі порушення виправлені — тепер error
    'local-rules/no-odd-spacing': 'error',

    // Local rule: Заборона Heroicons (використовуй lucide-react)
    'local-rules/no-heroicons': 'error',

    // Local rule: Заборона raw page wrappers (використовуй PageWrapper)
    // Warning level during migration, will become error after all pages migrated
    'local-rules/no-raw-page-wrapper': ['warn', {
      // Primitives can use raw classes (they are the source)
      allowedFiles: ['**/primitives/**'],
    }],

    // ═══════════════════════════════════════════════════════════════
    // TYPESCRIPT
    // ═══════════════════════════════════════════════════════════════

    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // ═══════════════════════════════════════════════════════════════
    // REACT
    // ═══════════════════════════════════════════════════════════════

    'react/prop-types': 'off', // TypeScript handles this
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ═══════════════════════════════════════════════════════════════
    // GENERAL
    // ═══════════════════════════════════════════════════════════════

    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    // Color picker - allowed to use raw colors
    {
      files: ['**/HexColorPicker.tsx'],
      rules: {
        'local-rules/no-raw-tailwind-colors': 'off',
      },
    },
    // Test files - relaxed rules
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'local-rules/no-raw-tailwind-colors': 'off',
        'local-rules/no-odd-spacing': 'off',
      },
    },
    // Storybook files - relaxed rules for story render functions
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        'local-rules/no-odd-spacing': 'off',
        'local-rules/no-raw-tailwind-colors': 'off',
        'react-hooks/rules-of-hooks': 'off', // Storybook render functions use hooks
        'react/no-unescaped-entities': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Config files
    {
      files: ['*.config.{js,ts}', '.eslintrc.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.min.js',
    'coverage/',
    'playwright-report/',
  ],
};
