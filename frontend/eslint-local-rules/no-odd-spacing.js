/**
 * ESLint rule: no-odd-spacing
 *
 * Забороняє використання непарних значень spacing (p-3, gap-5, m-7).
 * Вимагає 4px grid систему (p-2, p-4, p-6, p-8...).
 *
 * @see docs/design-system/02-spacing.md
 */

// Заборонені: 1, 3, 5, 7, 9, 11 (непарні, крім 0)
// Дозволені: 0, 0.5, 1.5, 2, 2.5, 4, 6, 8, 10, 12, 14, 16, 20, 24...
const FORBIDDEN_SPACING_PATTERN = /\b(p|m|gap|space-[xy]|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr|inset|top|right|bottom|left)-([13579]|11|13|15)(?!\d)\b/;

// Винятки - spacing що може бути непарним (дуже малі значення)
const ALLOWED_SMALL_VALUES = ['0.5', '1.5', '2.5', '3.5'];

// Whitelist - класи що виглядають як spacing але це не spacing
// (CSS transforms, fractions, data-* attributes)
const WHITELIST_PATTERNS = [
  /left-1\/2/,        // CSS transform: translate-x-[-50%]
  /right-1\/2/,       // CSS transform
  /top-1\/2/,         // CSS transform
  /bottom-1\/2/,      // CSS transform
  /slide-.*-left-1\/2/,   // Animation transforms
  /slide-.*-right-1\/2/,
  /slide-.*-top-1\/2/,
  /slide-.*-bottom-1\/2/,
  /from-left-1\/2/,   // Animation from
  /from-right-1\/2/,
  /from-top-1\/2/,
  /from-bottom-1\/2/,
  /to-left-1\/2/,     // Animation to
  /to-right-1\/2/,
  /to-top-1\/2/,
  /to-bottom-1\/2/,
];

const SPACING_ALTERNATIVES = {
  '1': '0.5 або 2',
  '3': '2 або 4',
  '5': '4 або 6',
  '7': '6 або 8',
  '9': '8 або 10',
  '11': '10 або 12',
  '13': '12 або 14',
  '15': '14 або 16',
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow odd spacing values, enforce 4px grid system',
      category: 'Design System',
      recommended: true,
      url: 'docs/design-system/02-spacing.md',
    },
    fixable: 'code',
    messages: {
      noOddSpacing:
        '⚠️ Непарний spacing "{{found}}" порушує 4px grid.\n' +
        '   Використай: {{alternatives}}\n' +
        '   📖 See: docs/design-system/02-spacing.md',
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
      // Check user-provided allowedPatterns
      if (allowedPatterns.some(pattern => pattern.test(className))) {
        return true;
      }
      // Check built-in whitelist (CSS transforms, fractions)
      return WHITELIST_PATTERNS.some(pattern => pattern.test(className));
    }

    function extractSpacingValue(className) {
      const match = className.match(/-(1|3|5|7|9|11|13|15)(?!\d)/);
      return match ? match[1] : null;
    }

    function getSuggestedFix(className) {
      // p-3 → p-4, gap-5 → gap-6
      const value = extractSpacingValue(className);
      if (!value) return null;

      const numValue = parseInt(value, 10);
      const newValue = numValue + 1; // Завжди округлюємо вгору до парного
      return className.replace(`-${value}`, `-${newValue}`);
    }

    function checkClassNames(node, classString, isFixable = false) {
      if (typeof classString !== 'string') return;

      const classes = classString.split(/\s+/);

      for (const className of classes) {
        if (isAllowed(className)) continue;

        if (FORBIDDEN_SPACING_PATTERN.test(className)) {
          const spacingValue = extractSpacingValue(className);
          const suggestedFix = getSuggestedFix(className);

          const reportObj = {
            node,
            messageId: 'noOddSpacing',
            data: {
              found: className,
              alternatives: spacingValue
                ? SPACING_ALTERNATIVES[spacingValue] || `${parseInt(spacingValue) + 1}`
                : 'Check design system docs',
            },
          };

          // Auto-fix for simple string literals
          if (isFixable && suggestedFix && node.value?.type === 'Literal') {
            reportObj.fix = function(fixer) {
              const newValue = node.value.value.replace(className, suggestedFix);
              return fixer.replaceText(node.value, `"${newValue}"`);
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

        // String literal: className="p-3"
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkClassNames(node, node.value.value, true);
        }

        // Template literal: className={`p-3 ${condition}`}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          // Simple string in expression: className={"p-3"}
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
          // String argument: cn("p-3", ...)
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkClassNames(node, arg.value, false);
          }

          // Template literal: cn(`p-3 ${x}`)
          if (arg.type === 'TemplateLiteral') {
            for (const quasi of arg.quasis) {
              checkClassNames(node, quasi.value.raw, false);
            }
          }

          // Object: cn({ "p-3": condition })
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
