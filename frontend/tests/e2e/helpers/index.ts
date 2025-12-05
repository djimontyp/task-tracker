/**
 * E2E Test Helpers
 *
 * Centralized export for all E2E test helper functions
 */

// Accessibility testing helpers
export {
  checkA11y,
  checkA11yCritical,
  checkA11yStrict,
  checkA11yCriteria,
  checkTouchTargets,
  checkFocusVisibility,
  checkColorNotAlone,
} from './checkA11y'

export type { CheckA11yOptions, A11yImpact } from './checkA11y'
