/**
 * ESLint rule: no-raw-zindex
 *
 * Disallows raw Tailwind z-index classes (z-10, z-50, z-[100]).
 * Requires semantic z-index tokens (z-dropdown, z-modal, z-toast).
 *
 * @see docs/design-system/README.md
 * @see frontend/src/shared/tokens/zindex.ts
 */

// Allowed semantic z-index tokens
const ALLOWED_ZINDEX = [
  'z-base',           // 0 - Default content
  'z-dropdown',       // 10 - Dropdowns, selects, autocomplete
  'z-sticky',         // 20 - Sticky headers, floating buttons
  'z-fixed',          // 30 - Fixed navigation, sidebars
  'z-modal-backdrop', // 40 - Modal/dialog backdrops
  'z-modal',          // 50 - Modals, dialogs, sheets
  'z-popover',        // 60 - Popovers, context menus
  'z-tooltip',        // 70 - Tooltips
  'z-toast',          // 80 - Toast notifications
  'z-max',            // 9999 - Emergency override
];

// Pattern to detect raw z-index values (applied per class)
// Matches: z-0, z-10, z-20, z-30, z-40, z-50, z-[100], z-[9999]
const RAW_ZINDEX_NUMERIC = /^z-\d+$/;
const RAW_ZINDEX_ARBITRARY = /^z-\[\d+\]$/;

// Mapping from raw values to semantic alternatives
const ZINDEX_ALTERNATIVES = {
  '0': 'z-base',
  '10': 'z-dropdown',
  '20': 'z-sticky',
  '30': 'z-fixed',
  '40': 'z-modal-backdrop',
  '50': 'z-modal',
  '60': 'z-popover',
  '70': 'z-tooltip',
  '80': 'z-toast',
  '9999': 'z-max',
  // Common arbitrary values
  '100': 'z-toast or z-max',
  '999': 'z-max',
  '1000': 'z-max',
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw Tailwind z-index classes, require semantic tokens',
      category: 'Design System',
      recommended: true,
      url: 'docs/design-system/README.md',
    },
    fixable: 'code',
    messages: {
      noRawZindex:
        '❌ Raw z-index "{{found}}" is forbidden.\n' +
        '   Use semantic token: {{alternatives}}\n' +
        '   Available tokens: z-base, z-dropdown, z-sticky, z-fixed, z-modal-backdrop, z-modal, z-popover, z-tooltip, z-toast, z-max\n' +
        '   📖 See: src/shared/tokens/zindex.ts',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: {
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
    const allowedPatterns = (options.allowedPatterns || []).map(p => new RegExp(p));

    function isAllowed(className) {
      // Check if it's one of the semantic tokens
      if (ALLOWED_ZINDEX.includes(className)) {
        return true;
      }
      // Check user-provided allowedPatterns
      return allowedPatterns.some(pattern => pattern.test(className));
    }

    function extractZindexValue(className) {
      const match = className.match(/z-(\d+|\[\d+\])/);
      if (!match) return null;
      // Remove brackets for arbitrary values: [100] -> 100
      return match[1].replace(/[\[\]]/g, '');
    }

    function getSuggestedFix(className) {
      const value = extractZindexValue(className);
      if (!value) return null;

      // Find the closest semantic alternative
      const numValue = parseInt(value, 10);

      // Exact match
      if (ZINDEX_ALTERNATIVES[value]) {
        return ZINDEX_ALTERNATIVES[value].split(' or ')[0]; // Take first suggestion
      }

      // Find closest lower value
      const semanticValues = [0, 10, 20, 30, 40, 50, 60, 70, 80];
      let closest = 'z-base';
      for (const sv of semanticValues) {
        if (numValue >= sv) {
          closest = ZINDEX_ALTERNATIVES[String(sv)] || closest;
        }
      }

      // For very high values, suggest z-max
      if (numValue > 80) {
        return 'z-max';
      }

      return closest;
    }

    function checkClassNames(node, classString, isFixable = false, literalNode = null) {
      if (typeof classString !== 'string') return;

      const classes = classString.split(/\s+/);

      for (const className of classes) {
        if (isAllowed(className)) continue;

        // Check if it's a raw z-index class (numeric or arbitrary)
        if (RAW_ZINDEX_NUMERIC.test(className) || RAW_ZINDEX_ARBITRARY.test(className)) {
          const zindexValue = extractZindexValue(className);
          const suggestedFix = getSuggestedFix(className);

          const reportObj = {
            node,
            messageId: 'noRawZindex',
            data: {
              found: className,
              alternatives: ZINDEX_ALTERNATIVES[zindexValue] || suggestedFix || 'Check available tokens',
            },
          };

          // Auto-fix for simple string literals
          if (isFixable && suggestedFix && literalNode) {
            reportObj.fix = function(fixer) {
              const newValue = literalNode.value.replace(className, suggestedFix);
              return fixer.replaceText(literalNode, `"${newValue}"`);
            };
          }

          context.report(reportObj);
        }
      }
    }

    return {
      // JSX: className="..."
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        // String literal: className="z-50"
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkClassNames(node, node.value.value, true, node.value);
        }

        // Template literal: className={`z-50 ${condition}`}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          // Simple string in expression: className={"z-50"}
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            checkClassNames(node, expr.value, false);
          }

          // Template literal
          if (expr.type === 'TemplateLiteral') {
            for (const quasi of expr.quasis) {
              checkClassNames(node, quasi.value.raw, false);
            }
          }
        }
      },

      // cn() / clsx() / cva() calls
      CallExpression(node) {
        const calleeName = node.callee.name || node.callee.property?.name;

        if (!['cn', 'clsx', 'cva', 'twMerge', 'classNames'].includes(calleeName)) {
          return;
        }

        for (const arg of node.arguments) {
          // String argument: cn("z-50", ...)
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkClassNames(node, arg.value, false);
          }

          // Template literal: cn(`z-50 ${x}`)
          if (arg.type === 'TemplateLiteral') {
            for (const quasi of arg.quasis) {
              checkClassNames(node, quasi.value.raw, false);
            }
          }

          // Object: cn({ "z-50": condition })
          if (arg.type === 'ObjectExpression') {
            for (const prop of arg.properties) {
              if (prop.key?.type === 'Literal' && typeof prop.key.value === 'string') {
                checkClassNames(node, prop.key.value, false);
              }
            }
          }
        }
      },
    };
  },
};
