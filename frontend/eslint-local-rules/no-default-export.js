/**
 * ESLint rule: no-default-export
 *
 * Забороняє default exports в feature components.
 * Вимагає використання named exports для кращого tree-shaking та рефакторингу.
 *
 * ✅ ДОЗВОЛЕНО:
 * export { ComponentName }
 * export const ComponentName = () => {}
 *
 * ❌ ЗАБОРОНЕНО:
 * export default ComponentName
 * export default function() {}
 *
 * @see CLAUDE.md - "Стандартизувати exports на named"
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow default exports in favor of named exports',
      category: 'Code Style',
      recommended: true,
    },
    messages: {
      noDefaultExport:
        '❌ Default export is forbidden.\n' +
        '   Use named export instead.\n' +
        '   Before: export default ComponentName\n' +
        '   After:  export { ComponentName }\n' +
        '   📖 See: CLAUDE.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'File patterns where default exports are allowed',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedPatterns = options.allowedPatterns || [];

    const filename = context.getFilename();

    // Check if file matches any allowed pattern
    const isAllowed = allowedPatterns.some((pattern) => {
      if (pattern.includes('*')) {
        // Simple glob matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filename);
      }
      return filename.includes(pattern);
    });

    if (isAllowed) {
      return {};
    }

    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: 'noDefaultExport',
        });
      },
    };
  },
};
