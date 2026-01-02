/**
 * ESLint rule: no-hardcoded-text
 *
 * Забороняє hardcoded тексти в JSX. Вимагає використання i18n функції t().
 * Блокує commit якщо знайдено незлокалізовані тексти.
 *
 * @see frontend/src/i18n/config.ts
 */

// Атрибути які потребують локалізації
const TEXT_ATTRIBUTES = [
  'label',
  'placeholder',
  'title',
  'aria-label',
  'aria-placeholder',
  'aria-description',
  'alt',
];

// Патерни які можна ігнорувати (не потребують локалізації)
const IGNORE_PATTERNS = [
  // Тільки пробіли/переноси
  /^\s*$/,
  // Тільки числа (можливо з одиницями)
  /^[\d.,]+(%|px|rem|em|vh|vw|ms|s|KB|MB|GB)?$/,
  // Тільки пунктуація та символи
  /^[•·—–\-|\/\\:;.,!?@#$%^&*()[\]{}'"<>=+_~`]+$/,
  // Скорочення одиниць (1px, 100%, 2rem)
  /^\d+[a-z%]+$/i,
  // CSS-like values
  /^(auto|none|inherit|initial|unset|flex|grid|block|inline|hidden|visible)$/,
  // Технічні строки (URL, шляхи)
  /^(https?:|mailto:|tel:|\/|#|\.\/)/,
  // Emoji only
  /^[\p{Emoji}\s]+$/u,
  // Single letters/initials
  /^[A-Z]{1,2}$/,
  // Version strings
  /^v?\d+\.\d+(\.\d+)?(-\w+)?$/,
  // Date/time formats
  /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/,
  // Keyboard shortcuts (Ctrl+S, ⌘K)
  /^[⌘⌃⌥⇧]?[A-Z](\+[A-Z])*$/i,
  /^(Ctrl|Cmd|Alt|Shift|Meta)\+[A-Z]$/i,
];

// Компоненти де текст дозволений (code blocks, pre, тощо)
const ALLOWED_COMPONENTS = [
  'code',
  'pre',
  'Code',
  'Pre',
  'kbd',
  'Kbd',
  'CodeBlock',
  'SyntaxHighlighter',
];

// Атрибути які ігноруємо (технічні)
const IGNORED_ATTRIBUTES = [
  'className',
  'class',
  'style',
  'key',
  'id',
  'name',
  'type',
  'value', // form values - handled separately
  'href',
  'src',
  'data-testid',
  'data-cy',
  'role',
  'htmlFor',
  'for',
  'ref',
  'tabIndex',
  'autoComplete',
  'pattern',
  'accept',
  'method',
  'action',
  'target',
  'rel',
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded text in JSX, require i18n t() function',
      category: 'Internationalization',
      recommended: true,
      url: 'frontend/src/i18n/config.ts',
    },
    messages: {
      noHardcodedText:
        '❌ Hardcoded text "{{text}}" found.\n' +
        '   Use i18n: {t(\'namespace.key\')} instead.\n' +
        '   📖 See: frontend/public/locales/',
      noHardcodedAttribute:
        '❌ Hardcoded text in {{attribute}}="{{text}}".\n' +
        '   Use i18n: {{attribute}}={t(\'namespace.key\')}.\n' +
        '   📖 See: frontend/public/locales/',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional regex patterns to ignore',
          },
          ignoreAttributes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional attributes to ignore',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const additionalPatterns = (options.allowedPatterns || []).map(p => new RegExp(p));
    const additionalIgnoredAttrs = options.ignoreAttributes || [];
    const allIgnoredAttrs = [...IGNORED_ATTRIBUTES, ...additionalIgnoredAttrs];

    // Check if text should be ignored
    function shouldIgnoreText(text) {
      if (!text || typeof text !== 'string') return true;

      const trimmed = text.trim();
      if (!trimmed) return true;

      // Check built-in patterns
      for (const pattern of IGNORE_PATTERNS) {
        if (pattern.test(trimmed)) return true;
      }

      // Check additional patterns
      for (const pattern of additionalPatterns) {
        if (pattern.test(trimmed)) return true;
      }

      return false;
    }

    // Check if inside allowed component (code, pre, etc.)
    function isInsideAllowedComponent(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'JSXElement') {
          const openingElement = parent.openingElement;
          if (openingElement?.name) {
            const tagName = openingElement.name.name || openingElement.name.property?.name;
            if (ALLOWED_COMPONENTS.includes(tagName)) {
              return true;
            }
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    // Check if text is a t() call result
    function isTFunction(node) {
      if (!node) return false;

      // Direct t() call: {t('key')}
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        // t('key')
        if (callee.type === 'Identifier' && callee.name === 't') return true;
        // i18n.t('key')
        if (callee.type === 'MemberExpression' && callee.property?.name === 't') return true;
      }

      // JSXExpressionContainer with t() inside
      if (node.type === 'JSXExpressionContainer') {
        return isTFunction(node.expression);
      }

      // Conditional: condition ? t('a') : t('b')
      if (node.type === 'ConditionalExpression') {
        return isTFunction(node.consequent) && isTFunction(node.alternate);
      }

      // Logical: isLoading && t('loading')
      if (node.type === 'LogicalExpression') {
        return isTFunction(node.right);
      }

      // Template literal with t(): `${t('key')} more`
      if (node.type === 'TemplateLiteral') {
        // Has expressions - might contain t()
        return node.expressions.some(expr => isTFunction(expr));
      }

      return false;
    }

    return {
      // JSX Text: <div>Hello World</div>
      JSXText(node) {
        const text = node.value;

        if (shouldIgnoreText(text)) return;
        if (isInsideAllowedComponent(node)) return;

        context.report({
          node,
          messageId: 'noHardcodedText',
          data: {
            text: text.trim().substring(0, 30) + (text.trim().length > 30 ? '...' : ''),
          },
        });
      },

      // JSX Attributes: <Button label="Click me" />
      JSXAttribute(node) {
        const attrName = node.name?.name;
        if (!attrName) return;

        // Skip ignored attributes
        if (allIgnoredAttrs.includes(attrName)) return;

        // Check text attributes
        if (!TEXT_ATTRIBUTES.includes(attrName)) return;

        // String literal: label="Hello"
        if (node.value?.type === 'Literal') {
          const text = node.value.value;
          if (typeof text !== 'string') return;
          if (shouldIgnoreText(text)) return;

          context.report({
            node,
            messageId: 'noHardcodedAttribute',
            data: {
              attribute: attrName,
              text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            },
          });
          return;
        }

        // Expression: label={expression}
        if (node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;

          // Skip if it's t() call
          if (isTFunction(expr)) return;

          // String in expression: label={"Hello"}
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            const text = expr.value;
            if (shouldIgnoreText(text)) return;

            context.report({
              node,
              messageId: 'noHardcodedAttribute',
              data: {
                attribute: attrName,
                text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
              },
            });
          }

          // Template literal without t(): label={`Hello ${name}`}
          if (expr.type === 'TemplateLiteral') {
            // Check if any quasi has substantial text
            for (const quasi of expr.quasis) {
              const text = quasi.value.raw;
              if (!shouldIgnoreText(text) && !isTFunction(expr)) {
                context.report({
                  node,
                  messageId: 'noHardcodedAttribute',
                  data: {
                    attribute: attrName,
                    text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                  },
                });
                break;
              }
            }
          }
        }
      },

      // Children as expression: <Button>{label}</Button> vs <Button>{"hardcoded"}</Button>
      JSXExpressionContainer(node) {
        // Only check direct children, not attributes
        if (node.parent?.type !== 'JSXElement') return;

        const expr = node.expression;

        // Skip empty expressions
        if (expr.type === 'JSXEmptyExpression') return;

        // Skip if t() call
        if (isTFunction(node)) return;

        // Skip if inside allowed component
        if (isInsideAllowedComponent(node)) return;

        // String literal in expression: {"Hello"}
        if (expr.type === 'Literal' && typeof expr.value === 'string') {
          const text = expr.value;
          if (shouldIgnoreText(text)) return;

          context.report({
            node,
            messageId: 'noHardcodedText',
            data: {
              text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            },
          });
        }

        // Template literal: {`Hello ${name}`}
        if (expr.type === 'TemplateLiteral' && !isTFunction(expr)) {
          for (const quasi of expr.quasis) {
            const text = quasi.value.raw;
            // Only report if there's substantial text (not just interpolation)
            if (!shouldIgnoreText(text) && text.length > 2) {
              context.report({
                node,
                messageId: 'noHardcodedText',
                data: {
                  text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                },
              });
              break;
            }
          }
        }
      },
    };
  },
};
