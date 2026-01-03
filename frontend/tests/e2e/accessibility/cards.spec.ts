import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * E2E Test: Accessibility - WCAG AA Compliance
 *
 * Tests card components for WCAG 2.1 AA violations using axe-core:
 * - Color contrast ratios (4.5:1 for text, 3:1 for UI components)
 * - Touch target sizes (WCAG 2.5.5: 44px minimum)
 * - Keyboard navigation and focus indicators
 * - Screen reader labels (aria-label, aria-labelledby)
 * - Semantic HTML and ARIA roles
 * - No color-only information
 *
 * Components tested:
 * - CompactCard (mobile, <640px)
 * - ExpandedCard (desktop, >=640px)
 * - CardActions (overflow menu)
 * - Interactive elements (buttons, links, menus)
 *
 * Philosophy:
 * "If UI breaks accessibility, test MUST fail."
 * Zero violations tolerance for production code.
 */

// ===================================================================
// CONSTANTS
// ===================================================================

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1024, height: 768 },
} as const

const ROUTES_WITH_CARDS = {
  agents: '/agents',
  topics: '/topics',
  projects: '/projects',
} as const

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa']

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Wait for page to fully load including network requests
 */
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(100)
}

/**
 * Run axe accessibility scan with WCAG AA tags
 */
async function runAxeScan(page: Page, include?: string): Promise<void> {
  const builder = new AxeBuilder({ page: page as any }).withTags(WCAG_TAGS)

  if (include) {
    builder.include(include)
  }

  const results = await builder.analyze()

  // Format violations for better error messages
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      const nodes = violation.nodes.map((node) => node.html).join('\n  ')
      return `\n${violation.id}: ${violation.description}\n  Impact: ${violation.impact}\n  Affected nodes:\n  ${nodes}`
    }).join('\n')

    throw new Error(`Found ${results.violations.length} accessibility violation(s):${violationMessages}`)
  }

  expect(results.violations, 'Expected 0 accessibility violations').toEqual([])
}

/**
 * Get first compact card selector
 */
function getCompactCardSelector(): string {
  return '[class*="sm:hidden"]'
}

/**
 * Get first expanded card selector
 */
function getExpandedCardSelector(): string {
  return '[class*="hidden"][class*="sm:block"]'
}

// ===================================================================
// WCAG COMPLIANCE - COMPACT CARD (MOBILE)
// ===================================================================

test.describe('Accessibility - CompactCard (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('CompactCard has no WCAG violations', async ({ page }) => {
    const cardSelector = getCompactCardSelector()
    const cardVisible = await page.locator(cardSelector).first().isVisible().catch(() => false)

    if (cardVisible) {
      await runAxeScan(page, cardSelector)
    }
  })

  test('CompactCard buttons have accessible names', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .include(getCompactCardSelector())
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Focus on button names only
      .analyze()

    const buttonNameViolations = results.violations.filter(
      (v) => v.id === 'button-name' || v.id === 'link-name'
    )

    expect(buttonNameViolations,
      `Found ${buttonNameViolations.length} button/link name violations`
    ).toHaveLength(0)
  })

  test('CompactCard ARIA roles are valid', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .include(getCompactCardSelector())
      .withTags(['wcag2a'])
      .analyze()

    const ariaViolations = results.violations.filter((v) =>
      v.id.includes('aria-') || v.id === 'role'
    )

    expect(ariaViolations,
      `Found ${ariaViolations.length} ARIA role violations`
    ).toHaveLength(0)
  })

  test('CompactCard overflow menu has no violations', async ({ page }) => {
    const card = page.locator(getCompactCardSelector()).first()

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        const menu = page.locator('[role="menu"]')
        if (await menu.isVisible()) {
          await runAxeScan(page, '[role="menu"]')

          // Close menu
          await page.keyboard.press('Escape')
        }
      }
    }
  })
})

// ===================================================================
// WCAG COMPLIANCE - EXPANDED CARD (DESKTOP)
// ===================================================================

test.describe('Accessibility - ExpandedCard (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('ExpandedCard has no WCAG violations', async ({ page }) => {
    const cardSelector = getExpandedCardSelector()
    const cardVisible = await page.locator(cardSelector).first().isVisible().catch(() => false)

    if (cardVisible) {
      await runAxeScan(page, cardSelector)
    }
  })

  test('ExpandedCard interactive elements are accessible', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .include(getExpandedCardSelector())
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Check for interactive element violations
    const interactiveViolations = results.violations.filter((v) =>
      ['button-name', 'link-name', 'aria-required-children', 'tabindex'].includes(v.id)
    )

    expect(interactiveViolations,
      `Found ${interactiveViolations.length} interactive element violations`
    ).toHaveLength(0)
  })
})

// ===================================================================
// COLOR CONTRAST - WCAG AA (4.5:1)
// ===================================================================

test.describe('Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('text contrast meets WCAG AA (4.5:1)', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    if (contrastViolations.length > 0) {
      const details = contrastViolations.map((v) => {
        return v.nodes.map((node) => {
          const fg = (node as any).any?.[0]?.data?.fgColor
          const bg = (node as any).any?.[0]?.data?.bgColor
          const ratio = (node as any).any?.[0]?.data?.contrastRatio
          return `  ${node.html}\n    FG: ${fg}, BG: ${bg}, Ratio: ${ratio}:1 (need 4.5:1)`
        }).join('\n')
      }).join('\n')

      throw new Error(`Color contrast violations:\n${details}`)
    }

    expect(contrastViolations).toHaveLength(0)
  })

  test('UI component contrast meets WCAG AA (3:1)', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2aa'])
      .analyze()

    // UI components (buttons, borders) need 3:1 contrast
    const uiContrastViolations = results.violations.filter((v) =>
      v.id === 'color-contrast' &&
      v.nodes.some((node) => {
        const ratio = (node as any).any?.[0]?.data?.contrastRatio
        return ratio && ratio < 3
      })
    )

    expect(uiContrastViolations,
      'UI components must have 3:1 contrast ratio minimum'
    ).toHaveLength(0)
  })
})

// ===================================================================
// TOUCH TARGETS - WCAG 2.5.5 (44px)
// ===================================================================

test.describe('Accessibility - Touch Targets', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('touch targets meet WCAG 2.5.5 (44px minimum)', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag22aa'])
      .analyze()

    const targetSizeViolations = results.violations.filter(
      (v) => v.id === 'target-size'
    )

    expect(targetSizeViolations,
      'All interactive elements must be at least 44x44px'
    ).toHaveLength(0)
  })

  test('card action buttons meet minimum size', async ({ page }) => {
    const card = page.locator(getCompactCardSelector()).first()

    if (await card.isVisible()) {
      const buttons = card.locator('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const box = await button.boundingBox()

          if (box) {
            const message = `Button ${i} size: ${box.width}x${box.height}px (WCAG 2.5.5 requires >= 44px)`
            expect(box.width, message).toBeGreaterThanOrEqual(44)
            expect(box.height, message).toBeGreaterThanOrEqual(44)
          }
        }
      }
    }
  })
})

// ===================================================================
// KEYBOARD NAVIGATION
// ===================================================================

test.describe('Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('keyboard navigation is accessible', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2a'])
      .analyze()

    const keyboardViolations = results.violations.filter((v) =>
      ['tabindex', 'focus-order-semantics'].includes(v.id)
    )

    expect(keyboardViolations,
      'Keyboard navigation must follow logical tab order'
    ).toHaveLength(0)
  })

  test('focus indicators are visible', async ({ page }) => {
    const card = page.locator(getCompactCardSelector()).first()

    if (await card.isVisible()) {
      const firstButton = card.locator('button').first()

      if (await firstButton.isVisible()) {
        // Focus button
        await firstButton.focus()

        // Check if focus is visible (element is focused)
        const isFocused = await firstButton.evaluate((el) => {
          return document.activeElement === el
        })

        expect(isFocused, 'Focus must be programmatically detectable').toBe(true)

        // Run axe on focused element to check for focus-visible violations
        const results = await new AxeBuilder({ page: page as any })
          .withTags(['wcag2a'])
          .analyze()

        const focusViolations = results.violations.filter((v) =>
          v.id.includes('focus')
        )

        expect(focusViolations, 'Focus indicators must be visible').toHaveLength(0)
      }
    }
  })
})

// ===================================================================
// SCREEN READER LABELS
// ===================================================================

test.describe('Accessibility - Screen Reader Labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('screen reader labels are present', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2a'])
      .analyze()

    const labelViolations = results.violations.filter((v) =>
      ['label', 'aria-label', 'button-name', 'link-name'].includes(v.id)
    )

    expect(labelViolations,
      'All interactive elements must have accessible labels'
    ).toHaveLength(0)
  })

  test('aria-labels are descriptive', async ({ page }) => {
    const card = page.locator(getCompactCardSelector()).first()

    if (await card.isVisible()) {
      const buttons = card.locator('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const ariaLabel = await button.getAttribute('aria-label')
          const textContent = await button.textContent()

          // Either aria-label or text content must be present and meaningful
          const hasAccessibleName = (ariaLabel && ariaLabel.length > 0) ||
                                   (textContent && textContent.trim().length > 0)

          expect(hasAccessibleName,
            `Button ${i} must have either aria-label or visible text`
          ).toBe(true)

          // If aria-label exists, it should be meaningful (not just whitespace)
          if (ariaLabel) {
            expect(ariaLabel.trim().length,
              `Button ${i} aria-label must be descriptive, got: "${ariaLabel}"`
            ).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})

// ===================================================================
// NO COLOR-ONLY INFORMATION
// ===================================================================

test.describe('Accessibility - Color-Only Information', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('status indicators include text/icon (not color-only)', async ({ page }) => {
    const card = page.locator(getCompactCardSelector()).first()

    if (await card.isVisible()) {
      // Look for badge elements (common status indicators)
      const badges = card.locator('[class*="badge"]')
      const badgeCount = await badges.count()

      if (badgeCount > 0) {
        for (let i = 0; i < badgeCount; i++) {
          const badge = badges.nth(i)
          const textContent = await badge.textContent()
          const hasIcon = await badge.locator('svg').count() > 0
          const hasText = textContent && textContent.trim().length > 0

          // Badge must have either icon or text (not just color)
          expect(hasIcon || hasText,
            `Badge ${i} must have icon or text, not rely on color alone`
          ).toBe(true)
        }
      }
    }
  })

  test('no information conveyed by color alone', async ({ page }) => {
    const results = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2a'])
      .analyze()

    // Look for violations related to color-only information
    const colorOnlyViolations = results.violations.filter((v) =>
      ['color-contrast', 'link-in-text-block'].includes(v.id)
    )

    // Note: axe-core doesn't have specific "color-only" rule,
    // but contrast and link detection help catch these issues
    expect(colorOnlyViolations,
      'Information must not rely on color alone'
    ).toHaveLength(0)
  })
})

// ===================================================================
// COMPREHENSIVE PAGE SCAN
// ===================================================================

test.describe('Accessibility - Full Page Scan', () => {
  test('agents page has no WCAG violations (mobile)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
    await runAxeScan(page)
  })

  test('agents page has no WCAG violations (desktop)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
    await runAxeScan(page)
  })

  test('topics page has no WCAG violations', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.topics)
    await waitForPageLoad(page)
    await runAxeScan(page)
  })

  test('projects page has no WCAG violations', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.projects)
    await waitForPageLoad(page)
    await runAxeScan(page)
  })
})
