/**
 * ESLint rule: no-direct-api-imports
 *
 * Disallows direct imports from @/shared/api or @/shared/lib/api in UI components.
 * Components should use TanStack Query hooks from feature modules instead.
 *
 * Rationale:
 * - Keeps components pure (props in, events out)
 * - Data fetching logic stays in custom hooks
 * - Better testability and separation of concerns
 *
 * @see frontend/CLAUDE.md (Data Layer Isolation)
 */

// Patterns for API imports that should be forbidden in components
const FORBIDDEN_IMPORTS = [
  '@/shared/api',
  '@/shared/lib/api',
  '../shared/api',
  '../shared/lib/api',
  '../../shared/api',
  '../../shared/lib/api',
];

// File patterns where API imports ARE allowed
const ALLOWED_FILES = [
  // Feature API modules (service classes)
  /\/features\/[\w-]+\/api\//,
  // Custom hooks
  /\/hooks\//,
  // Store files (Zustand)
  /\/store\//,
  // Test files
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  // Story files (may need mock API)
  /\.stories\.(ts|tsx)$/,
];

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow direct API imports in UI components, use TanStack Query hooks',
      category: 'Architecture',
      recommended: true,
      url: 'frontend/CLAUDE.md',
    },
    messages: {
      noDirectApiImport:
        '❌ Direct API import "{{source}}" in UI component.\n' +
        '   Move data fetching to a custom hook or feature service.\n' +
        '   Example: useQuery({ queryKey: [...], queryFn: () => service.fetch() })\n' +
        '   📖 See: frontend/CLAUDE.md → Data Fetching Patterns',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFiles: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const userAllowedFiles = (options.allowedFiles || []).map(p => new RegExp(p));
    const filename = context.getFilename();

    // Check if this file is allowed to have API imports
    function isFileAllowed() {
      // Check built-in allowed patterns
      if (ALLOWED_FILES.some(pattern => pattern.test(filename))) {
        return true;
      }
      // Check user-provided patterns
      return userAllowedFiles.some(pattern => pattern.test(filename));
    }

    // Skip if file is allowed
    if (isFileAllowed()) {
      return {};
    }

    function isForbiddenImport(source) {
      return FORBIDDEN_IMPORTS.some(forbidden =>
        source === forbidden || source.startsWith(forbidden + '/')
      );
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (isForbiddenImport(source)) {
          context.report({
            node,
            messageId: 'noDirectApiImport',
            data: {
              source,
            },
          });
        }
      },

      // Also catch dynamic imports: import('@/shared/api')
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
              messageId: 'noDirectApiImport',
              data: {
                source,
              },
            });
          }
        }
      },
    };
  },
};
