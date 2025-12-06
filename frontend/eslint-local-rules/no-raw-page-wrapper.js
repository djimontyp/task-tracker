/**
 * ESLint rule: no-raw-page-wrapper
 *
 * Забороняє raw page wrapper patterns в сторінках.
 * Вимагає використання PageWrapper primitive з @/shared/primitives.
 *
 * Detects:
 * - className="container" (Tailwind's container class)
 * - className="mx-auto max-w-*" patterns
 * - className with space-y-* on root page divs
 *
 * @see docs/design-system/04-layout-primitives.md
 */

// Page wrapper patterns that should use PageWrapper component
const RAW_WRAPPER_PATTERNS = [
  // Container class
  /\bcontainer\b/,
  // Direct max-width centering
  /\bmx-auto\s+max-w-/,
  /\bmax-w-\S+\s+mx-auto/,
];

// Warning patterns (should consider using PageWrapper)
const WARNING_PATTERNS = [
  // Root space-y on page level (should use PageWrapper variant="fullWidth")
  /^space-y-\d+$/,
  /^space-y-\d+\s/,
];

// Files to check (only page components)
const PAGE_FILE_PATTERN = /src\/pages\/.*\/(index|Page)\.tsx$/;

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow raw page wrapper patterns, use PageWrapper from @/shared/primitives',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      noContainer:
        '❌ Raw "container" class is forbidden in pages.\n' +
        '   Use: <PageWrapper variant="search"> or <PageWrapper variant="centered">\n' +
        '   📖 See: docs/design-system/04-layout-primitives.md',
      noRawMaxWidth:
        '❌ Raw "mx-auto max-w-*" pattern is forbidden in pages.\n' +
        '   Use: <PageWrapper variant="centered"> (max-w-3xl)\n' +
        '        <PageWrapper variant="wide"> (max-w-5xl)\n' +
        '        <PageWrapper variant="narrow"> (max-w-2xl)\n' +
        '   📖 See: @/shared/primitives/PageWrapper',
      considerPageWrapper:
        '⚠️ Consider using PageWrapper for consistent page layout.\n' +
        '   <PageWrapper variant="fullWidth"> provides:\n' +
        '   - Responsive vertical spacing\n' +
        '   - Overflow protection\n' +
        '   - Entrance animation\n' +
        '   📖 Import: import { PageWrapper } from "@/shared/primitives"',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files where raw wrappers are allowed (glob patterns)',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedFiles = options.allowedFiles || [];
    const filename = context.getFilename();

    // Only check page files
    if (!PAGE_FILE_PATTERN.test(filename)) {
      return {};
    }

    // Check if file is in allowed list
    const isAllowed = allowedFiles.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    });

    if (isAllowed) {
      return {};
    }

    return {
      JSXAttribute(node) {
        // Only check className attributes
        if (node.name.name !== 'className') {
          return;
        }

        let classValue = '';

        // Handle string literals
        if (node.value && node.value.type === 'Literal') {
          classValue = String(node.value.value || '');
        }
        // Handle template literals
        else if (node.value && node.value.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;
          if (expr.type === 'Literal') {
            classValue = String(expr.value || '');
          } else if (expr.type === 'TemplateLiteral' && expr.quasis.length > 0) {
            classValue = expr.quasis.map((q) => q.value.raw).join(' ');
          }
        }

        if (!classValue) {
          return;
        }

        // Check for container class
        if (/\bcontainer\b/.test(classValue)) {
          context.report({
            node,
            messageId: 'noContainer',
          });
          return;
        }

        // Check for mx-auto max-w-* pattern
        for (const pattern of RAW_WRAPPER_PATTERNS) {
          if (pattern.test(classValue)) {
            context.report({
              node,
              messageId: 'noRawMaxWidth',
            });
            return;
          }
        }

        // Only warn for first-level div in return statement (likely page wrapper)
        const parent = node.parent; // JSXOpeningElement
        if (parent && parent.type === 'JSXOpeningElement') {
          const elementName = parent.name.name;
          if (elementName === 'div') {
            // Check if this is a likely page wrapper (has space-y-* at start)
            for (const pattern of WARNING_PATTERNS) {
              if (pattern.test(classValue)) {
                // Only warn, don't error - existing code is acceptable
                // context.report({
                //   node,
                //   messageId: 'considerPageWrapper',
                // });
                // Disabled for now - too noisy during migration
                return;
              }
            }
          }
        }
      },
    };
  },
};
