/**
 * ESLint rule: no-hardcoded-api-paths
 *
 * Disallows hardcoded /api/v1 paths in string literals.
 * Use API_ENDPOINTS from @/shared/config/api instead.
 *
 * Rationale:
 * - Single source of truth for API paths
 * - Type-safe endpoint usage with autocomplete
 * - Easy to update API base path globally
 *
 * @see shared/config/api.ts
 */

// Pattern to detect hardcoded API paths
const HARDCODED_API_PATTERN = /^['"`]\/api\/v\d+\//;
const HARDCODED_API_REGEX = /\/api\/v\d+\//;

// Files where hardcoded paths ARE allowed (comments, generated code)
const ALLOWED_FILES = [
  // Generated API clients (orval)
  /\/shared\/api\/generated\//,
  // Type definition files with JSDoc comments
  /\/types\/.*\.ts$/,
  // Story files (may have path examples in comments)
  /\.stories\.(ts|tsx)$/,
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded /api/v1 paths, use API_ENDPOINTS',
      category: 'Best Practices',
      recommended: true,
      url: 'shared/config/api.ts',
    },
    fixable: null, // Cannot auto-fix (needs context to choose correct endpoint)
    messages: {
      noHardcodedPath:
        '❌ Hardcoded API path "{{path}}" is forbidden.\n' +
        '   Use API_ENDPOINTS from @/shared/config/api instead.\n' +
        '   Example: API_ENDPOINTS.messages, API_ENDPOINTS.topics, etc.\n' +
        '   📖 See: shared/config/api.ts',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Skip if file is in allowed list
    if (ALLOWED_FILES.some(pattern => pattern.test(filename))) {
      return {};
    }

    function checkNode(node) {
      // Only check string literals
      if (node.type !== 'Literal' || typeof node.value !== 'string') {
        return;
      }

      const value = node.value;

      // Check if it's a hardcoded API path
      if (HARDCODED_API_REGEX.test(value)) {
        // Skip if it's inside a comment (JSDoc, etc.)
        // Check parent - if it's in a template literal expression, check raw
        const sourceCode = context.getSourceCode();
        const token = sourceCode.getTokenByRangeStart(node.range[0]);

        // Skip if this is in a comment context
        const comments = sourceCode.getCommentsInside ?
          sourceCode.getCommentsInside(node.parent) : [];
        if (comments.length > 0) {
          return;
        }

        context.report({
          node,
          messageId: 'noHardcodedPath',
          data: {
            path: value,
          },
        });
      }
    }

    function checkTemplateLiteral(node) {
      // Check template literal quasis for hardcoded paths
      node.quasis.forEach(quasi => {
        if (HARDCODED_API_REGEX.test(quasi.value.raw)) {
          context.report({
            node: quasi,
            messageId: 'noHardcodedPath',
            data: {
              path: quasi.value.raw,
            },
          });
        }
      });
    }

    return {
      Literal: checkNode,
      TemplateLiteral: checkTemplateLiteral,
    };
  },
};
