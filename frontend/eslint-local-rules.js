/**
 * Local ESLint Rules for Design System Enforcement
 *
 * Used by eslint-plugin-local-rules
 * @see https://github.com/cletusw/eslint-plugin-local-rules
 */

module.exports = {
  'no-raw-tailwind-colors': require('./eslint-local-rules/no-raw-tailwind-colors'),
  'no-odd-spacing': require('./eslint-local-rules/no-odd-spacing'),
  'no-heroicons': require('./eslint-local-rules/no-heroicons'),
};
