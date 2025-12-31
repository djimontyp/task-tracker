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
    'boundaries',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    // ═══════════════════════════════════════════════════════════════
    // IMPORT RESOLVER - Required for boundaries plugin
    // ═══════════════════════════════════════════════════════════════
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
    // ═══════════════════════════════════════════════════════════════
    // BOUNDARIES - Layer architecture enforcement
    // ═══════════════════════════════════════════════════════════════
    'boundaries/elements': [
      { type: 'shared', pattern: ['src/shared/**/*'], mode: 'full' },
      { type: 'features', pattern: ['src/features/**/*'], mode: 'full' },
      { type: 'pages', pattern: ['src/pages/**/*'], mode: 'full' },
      { type: 'app', pattern: ['src/app/**/*'], mode: 'full' },
    ],
    'boundaries/ignore': [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.stories.tsx',
    ],
  },
  rules: {
    // ═══════════════════════════════════════════════════════════════
    // LAYER BOUNDARIES ENFORCEMENT
    // ═══════════════════════════════════════════════════════════════

    // Enforce layer import rules:
    // - shared: can only import from shared
    // - features: can import from shared and other features
    // - pages: can import from shared, features, and other pages
    // - app: can import from all layers
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'shared', allow: ['shared'] },
        { from: 'features', allow: ['shared', 'features'] },
        { from: 'pages', allow: ['shared', 'features', 'pages'] },
        { from: 'app', allow: ['shared', 'features', 'pages', 'app'] },
      ],
    }],

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

    // Local rule: Заборона raw z-index (використовуй z-dropdown, z-modal, тощо)
    'local-rules/no-raw-zindex': 'error',

    // Local rule: Заборона arbitrary fonts (використовуй font-sans, font-serif, font-mono)
    'local-rules/no-direct-fonts': 'error',

    // Local rule: Заборона прямих API імпортів в UI компонентах
    // Warning level — компоненти мають використовувати TanStack Query hooks
    'local-rules/no-direct-api-imports': 'warn',

    // Local rule: Заборона hardcoded /api/v1 paths
    // Використовуй API_ENDPOINTS з @/shared/config/api
    'local-rules/no-hardcoded-api-paths': 'error',

    // Local rule: Заборона data fetching в presenter компонентах
    // shared/components та shared/patterns мають бути портативними (CDD)
    // Дозволені виключення: файли з Provider або Layout в імені
    'local-rules/no-data-in-presenters': 'error',

    // Local rule: Заборона default exports (використовуй named exports)
    // Named exports краще для tree-shaking та рефакторингу
    // Виключення: pages (React.lazy), config files, stories (Storybook meta)
    'local-rules/no-default-export': ['error', {
      allowedPatterns: [
        '**/pages/**',
        '*.config.*',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'storybook/**',
        '.storybook/**',
        '*.stories.tsx',
        '*.stories.ts',
      ],
    }],

    // Local rule: Заборона raw page wrappers (використовуй PageWrapper)
    // Warning level during migration, will become error after all pages migrated
    'local-rules/no-raw-page-wrapper': ['warn', {
      // Primitives can use raw classes (they are the source)
      allowedFiles: ['**/primitives/**'],
    }],

    // ═══════════════════════════════════════════════════════════════
    // STORYBOOK ENFORCEMENT
    // ═══════════════════════════════════════════════════════════════

    // Local rule: Всі story файли повинні мати tags: ['autodocs']
    // Warning спочатку, перейде в error після міграції існуючих stories
    'local-rules/stories-require-autodocs': 'warn',

    // Local rule: Заборона i18n ключів в stories (labelKey, titleKey, etc.)
    // i18n не резолвиться в Storybook — використовуй прямі значення (label, title)
    'local-rules/stories-no-i18n-keys': 'error',

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
    // Layouts - bridge between shared and features
    // MainLayout needs to inject SearchContainer from features into Navbar
    {
      files: ['**/layouts/**/*.tsx'],
      rules: {
        'boundaries/element-types': ['error', {
          default: 'disallow',
          rules: [
            { from: 'shared', allow: ['shared', 'features'] },
          ],
        }],
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
        'local-rules/no-raw-zindex': 'off',
      },
    },
    // Storybook files - relaxed rules for story render functions
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        'local-rules/no-odd-spacing': 'off',
        'local-rules/no-raw-tailwind-colors': 'off',
        'local-rules/no-raw-zindex': 'off',
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
