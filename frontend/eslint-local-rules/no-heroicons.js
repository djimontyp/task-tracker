/**
 * ESLint rule: no-heroicons
 *
 * Забороняє імпорти з @heroicons/react та @radix-ui/react-icons.
 * Вимагає використання lucide-react (єдина дозволена icon library).
 *
 * @see https://ui.shadcn.com/docs/changelog - shadcn/ui перейшов на Lucide
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow @heroicons/react and @radix-ui/react-icons imports, use lucide-react instead',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      noHeroicons:
        '❌ Heroicons import is forbidden.\n' +
        '   Use lucide-react instead.\n' +
        '   Example: import { Folder, Check, X } from "lucide-react"\n' +
        '   📖 See: frontend/AGENTS.md',
      noRadixIcons:
        '❌ Radix Icons import is forbidden.\n' +
        '   Use lucide-react instead.\n' +
        '   Mapping: Cross2Icon→X, CheckIcon→Check, ChevronRightIcon→ChevronRight\n' +
        '   📖 See: frontend/AGENTS.md',
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === 'string') {
          if (source.startsWith('@heroicons/react')) {
            context.report({
              node,
              messageId: 'noHeroicons',
            });
          }
          if (source === '@radix-ui/react-icons') {
            context.report({
              node,
              messageId: 'noRadixIcons',
            });
          }
        }
      },
    };
  },
};
