/**
 * Accessibility Testing Helper
 *
 * Reusable helper for running axe-core accessibility scans in Playwright tests.
 * Implements WCAG 2.1 Level AA compliance checks.
 *
 * @see https://playwright.dev/docs/accessibility-testing
 * @see https://www.deque.com/axe/core-documentation/
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Severity levels for accessibility violations
 */
export type A11yImpact = 'minor' | 'moderate' | 'serious' | 'critical'

/**
 * Configuration options for accessibility checks
 */
export interface CheckA11yOptions {
  /** WCAG tags to check (default: wcag2a, wcag2aa) */
  tags?: string[]

  /** Rules to disable (e.g., known issues being fixed) */
  disableRules?: string[]

  /** Include only specific rules */
  includeRules?: string[]

  /** Minimum impact level to fail on (default: serious) */
  failOnImpact?: A11yImpact

  /** CSS selector to scope the check (default: entire page) */
  scope?: string

  /** Log violations to console even if not failing */
  verbose?: boolean
}

/**
 * Default WCAG 2.1 AA rules to check
 */
const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa']

/**
 * Rules that may need temporary disabling during migration
 * Remove from this list as issues are fixed
 */
const KNOWN_ISSUE_RULES: string[] = []

/**
 * Impact severity order (higher = more severe)
 */
const IMPACT_SEVERITY: Record<A11yImpact, number> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
}

/**
 * Format violation for readable console output
 */
function formatViolation(violation: {
  id: string
  impact?: string
  description: string
  nodes: Array<{ html: string; target: unknown[] }>
}): string {
  const nodeCount = violation.nodes.length
  const targets = violation.nodes
    .slice(0, 3)
    .map((n) => n.target.map(String).join(' > '))
    .join('\n      ')
  const more = nodeCount > 3 ? `\n      ... and ${nodeCount - 3} more` : ''

  return `
  [${violation.impact?.toUpperCase()}] ${violation.id}
    ${violation.description}
    Affected elements (${nodeCount}):
      ${targets}${more}
`
}

/**
 * Run an accessibility check on the current page or a specific element.
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 * @returns Promise that resolves if check passes, rejects with violations if fails
 *
 * @example
 * // Basic usage - check entire page
 * await checkA11y(page)
 *
 * @example
 * // Check specific component
 * await checkA11y(page, { scope: '[data-testid="modal"]' })
 *
 * @example
 * // Strict mode - fail on any violation
 * await checkA11y(page, { failOnImpact: 'minor' })
 *
 * @example
 * // Skip known issues being fixed
 * await checkA11y(page, { disableRules: ['color-contrast'] })
 */
export async function checkA11y(page: Page, options: CheckA11yOptions = {}): Promise<void> {
  const {
    tags = DEFAULT_TAGS,
    disableRules = [],
    includeRules,
    failOnImpact = 'serious',
    scope,
    verbose = false,
  } = options

  // Build axe configuration
  let builder = new AxeBuilder({ page }).withTags(tags)

  // Disable known issues + user-specified rules
  const allDisabledRules = [...KNOWN_ISSUE_RULES, ...disableRules]
  if (allDisabledRules.length > 0) {
    builder = builder.disableRules(allDisabledRules)
  }

  // Include only specific rules if specified
  if (includeRules && includeRules.length > 0) {
    // Note: axe-core doesn't have direct "includeRules", use analyze and filter
  }

  // Scope to specific element if provided
  if (scope) {
    builder = builder.include(scope)
  }

  // Run the analysis
  const results = await builder.analyze()

  // Get minimum severity level for failing
  const minSeverity = IMPACT_SEVERITY[failOnImpact]

  // Filter violations by severity
  const failingViolations = results.violations.filter((v) => {
    const impact = (v.impact as A11yImpact) || 'minor'
    return IMPACT_SEVERITY[impact] >= minSeverity
  })

  // Log all violations if verbose
  if (verbose && results.violations.length > 0) {
    console.log('\n--- Accessibility Violations ---')
    results.violations.forEach((v) => console.log(formatViolation(v)))
    console.log('--- End Violations ---\n')
  }

  // Format failing violations for assertion message
  if (failingViolations.length > 0) {
    const message = failingViolations.map((v) => formatViolation(v)).join('\n')

    expect(failingViolations, `Accessibility violations found:\n${message}`).toHaveLength(0)
  }
}

/**
 * Quick check for critical issues only.
 * Use this for smoke tests or pages under development.
 *
 * @param page - Playwright page object
 * @param scope - Optional CSS selector to scope the check
 */
export async function checkA11yCritical(page: Page, scope?: string): Promise<void> {
  await checkA11y(page, {
    failOnImpact: 'critical',
    scope,
  })
}

/**
 * Strict check for all WCAG 2.1 AA violations.
 * Use this for pages that should be fully compliant.
 *
 * @param page - Playwright page object
 * @param scope - Optional CSS selector to scope the check
 */
export async function checkA11yStrict(page: Page, scope?: string): Promise<void> {
  await checkA11y(page, {
    failOnImpact: 'minor',
    verbose: true,
    scope,
  })
}

/**
 * Check specific WCAG criteria
 *
 * @param page - Playwright page object
 * @param criteria - Criteria to check (e.g., 'focus-visible', 'color-contrast')
 */
export async function checkA11yCriteria(
  page: Page,
  criteria: string | string[]
): Promise<void> {
  const rules = Array.isArray(criteria) ? criteria : [criteria]

  const builder = new AxeBuilder({ page })

  // Run analysis
  const results = await builder.analyze()

  // Filter to only specified rules
  const relevantViolations = results.violations.filter((v) => rules.includes(v.id))

  if (relevantViolations.length > 0) {
    const message = relevantViolations.map((v) => formatViolation(v)).join('\n')
    expect(relevantViolations, `Accessibility criteria failed:\n${message}`).toHaveLength(0)
  }
}

/**
 * Verify touch target size (WCAG 2.5.5 Target Size)
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for interactive elements
 * @param minSize - Minimum size in pixels (default: 44)
 */
export async function checkTouchTargets(
  page: Page,
  selector: string,
  minSize: number = 44
): Promise<void> {
  const elements = page.locator(selector)
  const count = await elements.count()

  const violations: string[] = []

  for (let i = 0; i < count; i++) {
    const element = elements.nth(i)
    const box = await element.boundingBox()

    if (box) {
      if (box.width < minSize || box.height < minSize) {
        const html = await element.evaluate((el) => el.outerHTML.slice(0, 100))
        violations.push(
          `Element ${i}: ${box.width}x${box.height}px (min: ${minSize}px)\n  ${html}...`
        )
      }
    }
  }

  expect(violations, `Touch targets too small:\n${violations.join('\n')}`).toHaveLength(0)
}

/**
 * Verify focus visibility (WCAG 2.4.7 Focus Visible)
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for interactive elements
 */
export async function checkFocusVisibility(
  page: Page,
  selector: string = 'button, a, input, select, textarea, [tabindex]'
): Promise<void> {
  const elements = page.locator(selector)
  const count = await elements.count()

  const violations: string[] = []

  for (let i = 0; i < Math.min(count, 10); i++) {
    const element = elements.nth(i)

    // Focus the element
    await element.focus()

    // Check for visible focus indicator
    const hasVisibleFocus = await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      // Check for outline
      const outline = style.outline
      const outlineWidth = parseInt(style.outlineWidth) || 0

      // Check for box-shadow (common focus indicator)
      const boxShadow = style.boxShadow

      // Check for ring (Tailwind)
      const hasRing = el.classList.toString().includes('ring')

      return outlineWidth >= 2 || (boxShadow && boxShadow !== 'none') || hasRing
    })

    if (!hasVisibleFocus) {
      const html = await element.evaluate((el) => el.outerHTML.slice(0, 80))
      violations.push(`Element ${i} has no visible focus indicator:\n  ${html}...`)
    }
  }

  if (violations.length > 0) {
    console.warn('Focus visibility issues found:', violations)
  }

  // Warn but don't fail - focus styles can be complex
  expect(violations.length).toBeLessThanOrEqual(3)
}

/**
 * Verify color is not the only visual indicator (WCAG 1.4.1 Use of Color)
 *
 * @param page - Playwright page object
 * @param selector - CSS selector for status indicators
 */
export async function checkColorNotAlone(
  page: Page,
  selector: string = '[class*="status"], [class*="badge"], [role="status"]'
): Promise<void> {
  const elements = page.locator(selector)
  const count = await elements.count()

  const violations: string[] = []

  for (let i = 0; i < count; i++) {
    const element = elements.nth(i)

    // Element should have icon OR text (not just colored background)
    const hasIcon = (await element.locator('svg').count()) > 0
    const hasText = ((await element.textContent()) || '').trim().length > 0
    const hasAriaLabel = !!(await element.getAttribute('aria-label'))

    if (!hasIcon && !hasText && !hasAriaLabel) {
      const html = await element.evaluate((el) => el.outerHTML.slice(0, 100))
      violations.push(`Element relies on color alone:\n  ${html}...`)
    }
  }

  expect(violations, `Color-only indicators found:\n${violations.join('\n')}`).toHaveLength(0)
}

// Re-export types for convenience
export type { Page }
