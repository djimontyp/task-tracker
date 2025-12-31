/**
 * ESLint rule: stories-no-i18n-keys
 *
 * Prevents using i18n translation keys (labelKey, titleKey, etc.) in Storybook stories.
 * Stories should use direct string values for isolation and reliability.
 *
 * Problem: i18n keys don't resolve in Storybook (no real translations loaded).
 * Solution: Use direct `label` prop instead of `labelKey`.
 *
 * @example
 * // Bad - labelKey won't be translated in Storybook
 * { labelKey: 'sidebar.items.dashboard', label: 'Dashboard' }
 *
 * // Good - direct value works everywhere
 * { label: 'Dashboard' }
 */

// Common i18n key patterns: propKey -> prop
const I18N_KEY_PATTERNS = [
  { key: 'labelKey', direct: 'label' },
  { key: 'titleKey', direct: 'title' },
  { key: 'descriptionKey', direct: 'description' },
  { key: 'textKey', direct: 'text' },
  { key: 'messageKey', direct: 'message' },
  { key: 'placeholderKey', direct: 'placeholder' },
  { key: 'i18nKey', direct: 'label' },
  { key: 'translationKey', direct: 'label' },
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow i18n keys in Storybook stories - use direct values instead',
      category: 'Storybook',
      recommended: true,
    },
    messages: {
      noI18nKey:
        "❌ Don't use '{{keyProp}}' in stories - i18n keys don't resolve in Storybook.\n" +
        "   Use '{{directProp}}' with a direct string value instead.\n" +
        '   \n' +
        '   ❌ Bad:  { {{keyProp}}: "some.key", {{directProp}}: "Value" }\n' +
        '   ✅ Good: { {{directProp}}: "Value" }',
      redundantI18nKey:
        "❌ Redundant '{{keyProp}}' - you already have '{{directProp}}' with a value.\n" +
        "   Remove '{{keyProp}}' since i18n keys don't work in Storybook.\n" +
        '   This prop will be auto-removed by --fix.',
    },
    schema: [],
    fixable: 'code',
  },

  create(context) {
    const filename = context.getFilename();

    // Only check .stories.tsx/.stories.ts files
    if (!filename.endsWith('.stories.tsx') && !filename.endsWith('.stories.ts')) {
      return {};
    }

    /**
     * Check an object expression for i18n key props
     */
    function checkObjectForI18nKeys(node) {
      if (node.type !== 'ObjectExpression') return;

      const properties = node.properties.filter((p) => p.type === 'Property');

      // Build a map of property names to their nodes
      const propMap = new Map();
      for (const prop of properties) {
        if (prop.key.type === 'Identifier') {
          propMap.set(prop.key.name, prop);
        } else if (prop.key.type === 'Literal') {
          propMap.set(String(prop.key.value), prop);
        }
      }

      // Check each i18n pattern
      for (const pattern of I18N_KEY_PATTERNS) {
        const keyProp = propMap.get(pattern.key);
        const directProp = propMap.get(pattern.direct);

        if (keyProp) {
          if (directProp) {
            // Both exist - redundant, can auto-fix by removing keyProp
            context.report({
              node: keyProp,
              messageId: 'redundantI18nKey',
              data: {
                keyProp: pattern.key,
                directProp: pattern.direct,
              },
              fix(fixer) {
                // Remove the entire property including trailing comma
                const sourceCode = context.getSourceCode();
                const tokens = sourceCode.getTokensAfter(keyProp, { count: 1 });
                const nextToken = tokens[0];

                // Check if next token is a comma
                if (nextToken && nextToken.value === ',') {
                  return fixer.removeRange([keyProp.range[0], nextToken.range[1]]);
                }

                // Check for leading comma
                const tokensBefore = sourceCode.getTokensBefore(keyProp, { count: 1 });
                const prevToken = tokensBefore[0];
                if (prevToken && prevToken.value === ',') {
                  return fixer.removeRange([prevToken.range[0], keyProp.range[1]]);
                }

                return fixer.remove(keyProp);
              },
            });
          } else {
            // Only keyProp exists - warn but can't auto-fix (need manual value)
            context.report({
              node: keyProp,
              messageId: 'noI18nKey',
              data: {
                keyProp: pattern.key,
                directProp: pattern.direct,
              },
            });
          }
        }
      }

      // Recursively check nested objects
      for (const prop of properties) {
        if (prop.value.type === 'ObjectExpression') {
          checkObjectForI18nKeys(prop.value);
        } else if (prop.value.type === 'ArrayExpression') {
          for (const element of prop.value.elements) {
            if (element && element.type === 'ObjectExpression') {
              checkObjectForI18nKeys(element);
            }
          }
        }
      }
    }

    return {
      // Check story args: export const Primary: Story = { args: { ... } }
      Property(node) {
        if (
          node.key.type === 'Identifier' &&
          node.key.name === 'args' &&
          node.value.type === 'ObjectExpression'
        ) {
          checkObjectForI18nKeys(node.value);
        }
      },

      // Check inline objects in render functions
      ObjectExpression(node) {
        // Skip if this is inside args (already handled above)
        const parent = node.parent;
        if (parent && parent.type === 'Property' && parent.key.name === 'args') {
          return;
        }

        // Check object literals that might be data arrays
        checkObjectForI18nKeys(node);
      },
    };
  },
};
