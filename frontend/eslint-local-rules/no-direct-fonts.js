/**
 * ESLint rule: no-direct-fonts
 *
 * Disallows arbitrary font-family values in Tailwind (font-['Arial'], font-[system-ui]).
 * Requires only semantic font tokens: font-sans, font-serif, font-mono.
 *
 * @see docs/design-system/README.md
 */

// Allowed semantic font tokens (Tailwind defaults)
const ALLOWED_FONTS = [
  'font-sans',    // Inter, system-ui, sans-serif
  'font-serif',   // Georgia, serif
  'font-mono',    // Fira Code, monospace
];

// Pattern to detect arbitrary font values
// Matches: font-['Arial'], font-["Times New Roman"], font-[system-ui]
const ARBITRARY_FONT_PATTERN = /^font-\[['"]?[^\]]+['"]?\]$/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow arbitrary font-family values, require semantic font tokens',
      category: 'Design System',
      recommended: true,
      url: 'docs/design-system/README.md',
    },
    messages: {
      noDirectFont:
        '❌ Arbitrary font "{{found}}" is forbidden.\n' +
        '   Use semantic token: font-sans, font-serif, or font-mono\n' +
        '   📖 See: tailwind.config.js fontFamily configuration',
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
      if (ALLOWED_FONTS.includes(className)) {
        return true;
      }
      // Check user-provided allowedPatterns
      return allowedPatterns.some(pattern => pattern.test(className));
    }

    function checkClassNames(node, classString) {
      if (typeof classString !== 'string') return;

      const classes = classString.split(/\s+/);

      for (const className of classes) {
        if (isAllowed(className)) continue;

        // Check if it's an arbitrary font value
        if (ARBITRARY_FONT_PATTERN.test(className)) {
          context.report({
            node,
            messageId: 'noDirectFont',
            data: {
              found: className,
            },
          });
        }
      }
    }

    return {
      // JSX: className="..."
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        // String literal: className="font-['Arial']"
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkClassNames(node, node.value.value);
        }

        // JSX Expression: className={`font-['Arial']`}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            checkClassNames(node, expr.value);
          }

          if (expr.type === 'TemplateLiteral') {
            for (const quasi of expr.quasis) {
              checkClassNames(node, quasi.value.raw);
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
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkClassNames(node, arg.value);
          }

          if (arg.type === 'TemplateLiteral') {
            for (const quasi of arg.quasis) {
              checkClassNames(node, quasi.value.raw);
            }
          }

          if (arg.type === 'ObjectExpression') {
            for (const prop of arg.properties) {
              if (prop.key?.type === 'Literal' && typeof prop.key.value === 'string') {
                checkClassNames(node, prop.key.value);
              }
            }
          }
        }
      },
    };
  },
};
