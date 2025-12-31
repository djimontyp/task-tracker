/**
 * ESLint rule: no-data-in-presenters
 *
 * Forbids data fetching in presenter components (shared/components, shared/patterns).
 * These components should receive all data via props for portability.
 *
 * Rationale:
 * - Presenter components must be portable (work in Storybook without mocks)
 * - Data fetching logic stays in hooks, containers, or pages
 * - Better testability and Component-Driven Development (CDD)
 *
 * @see CLAUDE.md → Component Portability (CDD)
 */

// Patterns for data fetching imports that should be forbidden in presenters
const FORBIDDEN_IMPORTS = [
  '@tanstack/react-query',
  'axios',
  '@/shared/lib/api',
  '../shared/lib/api',
  '../../shared/lib/api',
  '../../../shared/lib/api',
];

// File name patterns that are exempt from this rule
const EXEMPT_PATTERNS = [
  /Provider/i,
  /Layout/i,
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid data fetching in presenter components (shared/components, shared/patterns)',
      category: 'Best Practices',
      recommended: true,
      url: 'CLAUDE.md',
    },
    messages: {
      forbidden:
        '❌ Data fetching forbidden in presenter components ({{source}}).\n' +
        '   Presenter components must be portable - receive all data via props.\n' +
        '   Move data fetching to hooks/ or parent container component.\n' +
        '   📖 See: CLAUDE.md → Component Portability',
    },
    schema: [],
  },

  create(context) {
    const filePath = context.getFilename();

    // Only apply to shared/components and shared/patterns
    const isPresenter =
      filePath.includes('shared/components') || filePath.includes('shared/patterns');

    if (!isPresenter) {
      return {};
    }

    // Skip test and story files
    if (
      filePath.endsWith('.test.tsx') ||
      filePath.endsWith('.test.ts') ||
      filePath.endsWith('.spec.tsx') ||
      filePath.endsWith('.spec.ts') ||
      filePath.endsWith('.stories.tsx') ||
      filePath.endsWith('.stories.ts')
    ) {
      return {};
    }

    // Allow exceptions for Providers and Layouts
    const basename = filePath.split('/').pop() || '';
    if (EXEMPT_PATTERNS.some((pattern) => pattern.test(basename))) {
      return {};
    }

    function isForbiddenImport(source) {
      return FORBIDDEN_IMPORTS.some(
        (forbidden) => source === forbidden || source.startsWith(forbidden + '/')
      );
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (isForbiddenImport(source)) {
          context.report({
            node,
            messageId: 'forbidden',
            data: { source },
          });
        }
      },

      // Also catch dynamic imports: import('@tanstack/react-query')
      CallExpression(node) {
        if (
          node.callee.type === 'Import' &&
          node.arguments[0]?.type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          const source = node.arguments[0].value;

          if (isForbiddenImport(source)) {
            context.report({
              node,
              messageId: 'forbidden',
              data: { source },
            });
          }
        }
      },
    };
  },
};
