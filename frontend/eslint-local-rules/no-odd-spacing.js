/**
 * ESLint rule: no-odd-spacing (STRICT MODE)
 *
 * WHITELIST-ONLY spacing система. Дозволяє ТІЛЬКИ визначені значення.
 * Все інше = ERROR.
 *
 * ДОЗВОЛЕНО (whitelist):
 * - 0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24
 * - Pixels: 0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96
 *
 * ЗАБОРОНЕНО (все інше):
 * - Десяткові: 1.5, 2.5, 3.5, 4.5... (не на 4px grid)
 * - Непопулярні: 5, 7, 9, 10, 11, 14, 18... (не в whitelist)
 *
 * @see docs/design-system/03-spacing.md
 */

// ═══════════════════════════════════════════════════════════════════════════
// STRICT WHITELIST - тільки ці значення дозволені
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_VALUES = new Set([
  '0',      // 0px - remove spacing
  '0.5',    // 2px - micro spacing (borders, fine-tuning)
  '1',      // 4px - compact (icons, tight text)
  '2',      // 8px - standard small ⭐
  '3',      // 12px - medium
  '4',      // 16px - standard large ⭐
  '6',      // 24px - section spacing ⭐
  '8',      // 32px - large sections
  '10',     // 40px - input icons offset
  '12',     // 48px - layout spacing
  '16',     // 64px - hero sections
  '20',     // 80px - extra large
  '24',     // 96px - max spacing
]);

// Spacing properties to check
const SPACING_PROPS = [
  'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr',  // padding
  'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr',  // margin
  'gap', 'gap-x', 'gap-y',                   // gap
  'space-x', 'space-y',                      // space between
  'inset', 'top', 'right', 'bottom', 'left', // positioning
  'inset-x', 'inset-y',                      // positioning shortcuts
];

// Pattern to extract spacing classes
const SPACING_REGEX = new RegExp(
  `\\b(${SPACING_PROPS.join('|')})-(-?[\\d.]+)(?!\\/)\\b`,
  'g'
);

// Whitelist patterns - not spacing (transforms, fractions, responsive)
const WHITELIST_PATTERNS = [
  /\/2$/,           // Fractions: left-1/2, top-1/2
  /\/3$/,           // Fractions: w-1/3
  /\/4$/,           // Fractions: w-3/4
  /\[.*\]$/,        // Arbitrary values: p-[10px]
];

// Alternatives for common violations
const ALTERNATIVES = {
  '1.5': '1 (4px) або 2 (8px)',
  '2.5': '2 (8px) або 3 (12px)',
  '3.5': '3 (12px) або 4 (16px)',
  '4.5': '4 (16px) або 6 (24px)',
  '5': '4 (16px) або 6 (24px)',
  '5.5': '6 (24px)',
  '6.5': '6 (24px) або 8 (32px)',
  '7': '6 (24px) або 8 (32px)',
  '7.5': '8 (32px)',
  '9': '8 (32px) або 12 (48px)',
  '10': '8 (32px) або 12 (48px)',
  '11': '12 (48px)',
  '14': '12 (48px) або 16 (64px)',
  '18': '16 (64px) або 20 (80px)',
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict spacing whitelist (0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24)',
      category: 'Design System',
      recommended: true,
      url: 'docs/design-system/03-spacing.md',
    },
    fixable: 'code',
    messages: {
      invalidSpacing:
        '❌ Spacing "{{found}}" не в whitelist.\n' +
        '   Дозволені: 0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24\n' +
        '   Альтернатива: {{alternatives}}\n' +
        '   📖 See: docs/design-system/03-spacing.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional file patterns to skip',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const skipPatterns = (options.allowedPatterns || []).map(p => new RegExp(p));
    const filename = context.getFilename();

    // Skip configured patterns
    if (skipPatterns.some(pattern => pattern.test(filename))) {
      return {};
    }

    function isWhitelisted(className) {
      return WHITELIST_PATTERNS.some(pattern => pattern.test(className));
    }

    function extractViolations(classString) {
      if (typeof classString !== 'string') return [];

      const violations = [];
      let match;

      // Reset regex
      SPACING_REGEX.lastIndex = 0;

      while ((match = SPACING_REGEX.exec(classString)) !== null) {
        const fullMatch = match[0];
        const value = match[2];

        // Skip whitelisted patterns (fractions, arbitrary)
        if (isWhitelisted(fullMatch)) continue;

        // Check if value is in allowed set
        if (!ALLOWED_VALUES.has(value)) {
          violations.push({
            className: fullMatch,
            value: value,
          });
        }
      }

      return violations;
    }

    function getSuggestedFix(className, value) {
      // Find closest allowed value
      const numValue = parseFloat(value);
      let closest = '4';
      let minDiff = Infinity;

      for (const allowed of ALLOWED_VALUES) {
        const diff = Math.abs(parseFloat(allowed) - numValue);
        if (diff < minDiff) {
          minDiff = diff;
          closest = allowed;
        }
      }

      return className.replace(`-${value}`, `-${closest}`);
    }

    function checkClassNames(node, classString, isFixable = false) {
      const violations = extractViolations(classString);

      for (const { className, value } of violations) {
        const suggestedFix = getSuggestedFix(className, value);

        const reportObj = {
          node,
          messageId: 'invalidSpacing',
          data: {
            found: className,
            alternatives: ALTERNATIVES[value] || suggestedFix,
          },
        };

        // Auto-fix for simple string literals
        if (isFixable && node.value?.type === 'Literal') {
          reportObj.fix = function(fixer) {
            const newValue = node.value.value.replace(className, suggestedFix);
            return fixer.replaceText(node.value, `"${newValue}"`);
          };
        }

        context.report(reportObj);
      }
    }

    return {
      // JSX: className="..."
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        // String literal: className="p-5"
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkClassNames(node, node.value.value, true);
        }

        // Expression: className={...}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          // String in expression: className={"p-5"}
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            checkClassNames(node, expr.value, false);
          }

          // Template literal: className={`p-5 ${x}`}
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
          // String: cn("p-5", ...)
          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            checkClassNames(node, arg.value, false);
          }

          // Template: cn(`p-5 ${x}`)
          if (arg.type === 'TemplateLiteral') {
            for (const quasi of arg.quasis) {
              checkClassNames(node, quasi.value.raw, false);
            }
          }

          // Object: cn({ "p-5": condition })
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
