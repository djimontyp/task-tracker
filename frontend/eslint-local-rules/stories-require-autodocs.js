/**
 * ESLint rule: stories-require-autodocs
 *
 * Ensures all Storybook story files have `tags: ['autodocs']` in their meta object.
 * This guarantees automatic documentation generation for all components.
 *
 * @see https://storybook.js.org/docs/writing-docs/autodocs
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "Require 'autodocs' tag in Storybook story meta",
      category: 'Storybook',
      recommended: true,
    },
    messages: {
      missingAutodocs:
        "❌ Story file missing 'autodocs' tag.\n" +
        "   Add tags: ['autodocs'] to your meta object:\n" +
        '   ```\n' +
        '   const meta: Meta<typeof Component> = {\n' +
        "     tags: ['autodocs'],\n" +
        '     ...\n' +
        '   };\n' +
        '   ```\n' +
        '   📖 See: .claude/skills/storybook/SKILL.md',
      missingTags:
        "❌ Story meta is missing 'tags' property.\n" +
        "   Add tags: ['autodocs'] for automatic documentation.\n" +
        '   📖 See: .claude/skills/storybook/SKILL.md',
    },
    schema: [],
    fixable: 'code',
  },

  create(context) {
    const filename = context.getFilename();

    // Only check .stories.tsx files
    if (!filename.endsWith('.stories.tsx') && !filename.endsWith('.stories.ts')) {
      return {};
    }

    return {
      // Find: const meta = { ... } or const meta: Meta<...> = { ... }
      VariableDeclarator(node) {
        // Check if variable name is 'meta'
        if (node.id.type !== 'Identifier' || node.id.name !== 'meta') {
          return;
        }

        // Check if init is an object expression
        if (!node.init || node.init.type !== 'ObjectExpression') {
          return;
        }

        const metaObject = node.init;

        // Find 'tags' property
        const tagsProperty = metaObject.properties.find(
          (prop) =>
            prop.type === 'Property' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'tags'
        );

        if (!tagsProperty) {
          // No tags property at all
          context.report({
            node: metaObject,
            messageId: 'missingTags',
            fix(fixer) {
              // Find a good place to insert (after title/component if exists)
              const firstProperty = metaObject.properties[0];
              if (firstProperty) {
                return fixer.insertTextBefore(
                  firstProperty,
                  "tags: ['autodocs'],\n  "
                );
              }
              return null;
            },
          });
          return;
        }

        // Check if tags includes 'autodocs'
        if (
          tagsProperty.value.type === 'ArrayExpression' &&
          tagsProperty.value.elements
        ) {
          const hasAutodocs = tagsProperty.value.elements.some(
            (el) => el && el.type === 'Literal' && el.value === 'autodocs'
          );

          if (!hasAutodocs) {
            context.report({
              node: tagsProperty,
              messageId: 'missingAutodocs',
              fix(fixer) {
                // Add 'autodocs' to existing array
                const arrayNode = tagsProperty.value;
                if (arrayNode.elements.length === 0) {
                  // Empty array: tags: []
                  return fixer.replaceText(arrayNode, "['autodocs']");
                } else {
                  // Has elements: tags: ['existing']
                  const lastElement =
                    arrayNode.elements[arrayNode.elements.length - 1];
                  return fixer.insertTextAfter(lastElement, ", 'autodocs'");
                }
              },
            });
          }
        }
      },
    };
  },
};
