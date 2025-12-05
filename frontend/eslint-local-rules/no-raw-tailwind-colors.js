/**
 * ESLint rule: no-raw-tailwind-colors
 *
 * Забороняє використання raw Tailwind кольорів (bg-red-500, text-green-600).
 * Вимагає семантичні токени (bg-semantic-success, text-status-connected).
 *
 * @see docs/design-system/01-colors.md
 */

const FORBIDDEN_COLOR_PATTERNS = [
  // Raw color scales - ЗАБОРОНЕНО
  /\b(bg|text|border|ring|outline|fill|stroke)-(red|green|blue|yellow|orange|purple|pink|indigo|violet|cyan|teal|emerald|lime|amber|rose|fuchsia|sky|slate|gray|zinc|neutral|stone)-\d{2,3}\b/,

  // Arbitrary colors - ЗАБОРОНЕНО
  /\b(bg|text|border|ring)-\[#[0-9a-fA-F]{3,8}\]/,
];

const SEMANTIC_ALTERNATIVES = {
  // Success states
  'green': 'semantic-success, status-connected',
  'emerald': 'semantic-success',
  'teal': 'semantic-success',

  // Error states
  'red': 'semantic-error, status-error, destructive',
  'rose': 'semantic-error, destructive',

  // Warning states
  'yellow': 'semantic-warning, status-validating',
  'amber': 'semantic-warning',
  'orange': 'semantic-warning',

  // Info states
  'blue': 'semantic-info, primary',
  'sky': 'semantic-info',
  'cyan': 'semantic-info',

  // Neutral
  'gray': 'muted, muted-foreground, border',
  'slate': 'muted, foreground',
  'zinc': 'muted, background',
  'neutral': 'muted',
  'stone': 'muted',

  // Other
  'purple': 'accent, atom-insight',
  'violet': 'accent',
  'indigo': 'primary',
  'pink': 'atom-problem',
  'fuchsia': 'accent',
  'lime': 'chart-signal',
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw Tailwind color classes, require semantic tokens',
      category: 'Design System',
      recommended: true,
      url: 'docs/design-system/01-colors.md',
    },
    messages: {
      noRawColor:
        '❌ Raw Tailwind color "{{found}}" is forbidden.\n' +
        '   Use semantic token instead: {{alternatives}}\n' +
        '   📖 See: docs/design-system/01-colors.md',
      noArbitraryColor:
        '❌ Arbitrary color "{{found}}" is forbidden.\n' +
        '   Define in CSS variables and use semantic tokens.\n' +
        '   📖 See: docs/design-system/01-colors.md',
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
      return allowedPatterns.some(pattern => pattern.test(className));
    }

    function extractColorName(className) {
      const match = className.match(/-(red|green|blue|yellow|orange|purple|pink|indigo|violet|cyan|teal|emerald|lime|amber|rose|fuchsia|sky|slate|gray|zinc|neutral|stone)-/);
      return match ? match[1] : null;
    }

    function checkClassNames(node, classString) {
      if (typeof classString !== 'string') return;

      const classes = classString.split(/\s+/);

      for (const className of classes) {
        if (isAllowed(className)) continue;

        for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
          if (pattern.test(className)) {
            const colorName = extractColorName(className);
            const isArbitrary = className.includes('[#');

            context.report({
              node,
              messageId: isArbitrary ? 'noArbitraryColor' : 'noRawColor',
              data: {
                found: className,
                alternatives: colorName
                  ? SEMANTIC_ALTERNATIVES[colorName] || 'Check design system docs'
                  : 'Check design system docs',
              },
            });
            break; // One error per class
          }
        }
      }
    }

    return {
      // JSX: className="..."
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        // String literal: className="bg-red-500"
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkClassNames(node, node.value.value);
        }

        // Template literal: className={`bg-red-500 ${condition}`}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          // Simple string in expression: className={"bg-red-500"}
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            checkClassNames(node, expr.value);
          }

          // Template literal
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
          // String argument: cn("bg-red-500", ...)
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkClassNames(node, arg.value);
          }

          // Template literal: cn(`bg-red-500 ${x}`)
          if (arg.type === 'TemplateLiteral') {
            for (const quasi of arg.quasis) {
              checkClassNames(node, quasi.value.raw);
            }
          }

          // Object: cn({ "bg-red-500": condition })
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
