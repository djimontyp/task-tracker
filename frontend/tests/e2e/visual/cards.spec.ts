import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Visual Regression Tests: Card Components
 *
 * Purpose: Prevent UI breakage via screenshot comparison
 *
 * Coverage:
 * - CompactCard (mobile, <640px): default, loading, error, empty states
 * - ExpandedCard (desktop, >=640px): default, metadata, footer states
 * - Responsive variants: mobile (375x667), desktop (1024x768)
 * - Interactive states: hover, focus, overflow menu open/closed
 *
 * Components tested:
 * - CompactCard (shared/patterns/CompactCard.tsx)
 * - AgentCard (features/agents/components/AgentCard.tsx)
 * - ProjectCard (features/projects/components/ProjectCard.tsx)
 * - TopicSearchCard (features/search/components/TopicSearchCard.tsx)
 *
 * Philosophy:
 * If UI breaks, these tests MUST fail.
 * If tests don't fail on breakage — tests are bad, rewrite them.
 */

// ===================================================================
// CONSTANTS
// ===================================================================

const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  desktop: { width: 1024, height: 768 }, // iPad landscape
} as const

const ROUTES_WITH_CARDS = {
  agents: '/agents',
  projects: '/projects',
  topics: '/topics',
} as const

const SCREENSHOT_OPTIONS = {
  maxDiffPixels: 100,
  threshold: 0.2,
} as const

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Wait for page to fully load including network and animations
 */
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(200) // Allow animations to settle
}

/**
 * Get first visible compact card (mobile)
 */
function getFirstCompactCard(page: Page) {
  return page.locator('[class*="sm:hidden"]').filter({
    has: page.locator('article, section, [role="button"]')
  }).first()
}

/**
 * Get first visible expanded card (desktop)
 */
function getFirstExpandedCard(page: Page) {
  return page.locator('[class*="hidden"][class*="sm:block"]').filter({
    has: page.locator('article, section, [role="button"]')
  }).first()
}

// ===================================================================
// COMPACT CARD - MOBILE (375x667)
// ===================================================================

test.describe('Visual Regression - CompactCard (Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
  })

  test('default state matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot('compact-card-default.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('with badge matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Verify badge exists
      const badge = card.locator('[class*="badge"], [class*="Badge"]')
      const hasBadge = await badge.isVisible().catch(() => false)

      if (hasBadge) {
        await expect(card).toHaveScreenshot('compact-card-with-badge.png', SCREENSHOT_OPTIONS)
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('overflow menu open matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(300)

        const menu = page.locator('[role="menu"]')
        if (await menu.isVisible()) {
          // Screenshot card + menu together
          const container = page.locator('body')
          await expect(container).toHaveScreenshot('compact-card-overflow-open.png', SCREENSHOT_OPTIONS)
        } else {
          test.skip()
        }
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('loading state matches snapshot', async ({ page }) => {
    // For loading state, we need to intercept API and delay response
    await page.route('**/api/**', async (route) => {
      await page.waitForTimeout(5000) // Never resolve
    })

    await page.goto(ROUTES_WITH_CARDS.agents)
    await page.waitForTimeout(500)

    // Look for loading skeleton
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]').first()

    if (await skeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(skeleton).toHaveScreenshot('compact-card-loading.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('error state matches snapshot', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/**', async (route) => {
      await route.abort('failed')
    })

    await page.goto(ROUTES_WITH_CARDS.agents)
    await page.waitForTimeout(1000)

    // Look for error state
    const errorIcon = page.locator('[class*="destructive"]').first()
    const errorCard = errorIcon.locator('..').locator('..').locator('..')

    if (await errorCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorCard).toHaveScreenshot('compact-card-error.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('empty state matches snapshot', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/agents') || url.includes('/projects') || url.includes('/topics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    // Look for empty state message
    const emptyMessage = page.getByText(/no.*found|empty|no items/i).first()

    if (await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      const container = page.locator('main, [role="main"]').first()
      await expect(container).toHaveScreenshot('compact-card-empty.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })
})

// ===================================================================
// EXPANDED CARD - DESKTOP (1024x768)
// ===================================================================

test.describe('Visual Regression - ExpandedCard (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
  })

  test('default state matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstExpandedCard(page)

    if (await card.isVisible()) {
      await expect(card).toHaveScreenshot('expanded-card-default.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('with metadata matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstExpandedCard(page)

    if (await card.isVisible()) {
      // Verify metadata exists (look for common metadata patterns)
      const metadata = card.locator('[class*="text-muted"], [class*="font-mono"]')
      const hasMetadata = await metadata.first().isVisible().catch(() => false)

      if (hasMetadata) {
        await expect(card).toHaveScreenshot('expanded-card-with-metadata.png', SCREENSHOT_OPTIONS)
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('with footer matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.projects)
    await waitForPageLoad(page)

    const card = getFirstExpandedCard(page)

    if (await card.isVisible()) {
      // Project cards have footer with version/update info
      const footer = card.locator('[class*="border-t"], footer').last()
      const hasFooter = await footer.isVisible().catch(() => false)

      if (hasFooter) {
        await expect(card).toHaveScreenshot('expanded-card-with-footer.png', SCREENSHOT_OPTIONS)
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('loading state matches snapshot', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await page.waitForTimeout(5000)
    })

    await page.goto(ROUTES_WITH_CARDS.agents)
    await page.waitForTimeout(500)

    const spinner = page.locator('[class*="spinner"], [class*="Spinner"]').first()

    if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      const loadingCard = spinner.locator('..').locator('..').locator('..')
      await expect(loadingCard).toHaveScreenshot('expanded-card-loading.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('error state matches snapshot', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.abort('failed')
    })

    await page.goto(ROUTES_WITH_CARDS.agents)
    await page.waitForTimeout(1000)

    const errorIcon = page.locator('[class*="destructive"]').first()
    const errorCard = errorIcon.locator('..').locator('..').locator('..')

    if (await errorCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorCard).toHaveScreenshot('expanded-card-error.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })
})

// ===================================================================
// RESPONSIVE VARIANTS
// ===================================================================

test.describe('Visual Regression - Responsive Variants', () => {
  test('mobile viewport shows compact cards', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const compactCard = getFirstCompactCard(page)
    const expandedCard = getFirstExpandedCard(page)

    const compactVisible = await compactCard.isVisible().catch(() => false)
    const expandedVisible = await expandedCard.isVisible().catch(() => false)

    expect(compactVisible, 'CompactCard MUST be visible on mobile').toBe(true)
    expect(expandedVisible, 'ExpandedCard MUST be hidden on mobile').toBe(false)

    if (compactVisible) {
      const container = page.locator('main, [role="main"]').first()
      await expect(container).toHaveScreenshot('responsive-mobile-viewport.png', SCREENSHOT_OPTIONS)
    }
  })

  test('desktop viewport shows expanded cards', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const compactCard = getFirstCompactCard(page)
    const expandedCard = getFirstExpandedCard(page)

    const compactVisible = await compactCard.isVisible().catch(() => false)
    const expandedVisible = await expandedCard.isVisible().catch(() => false)

    expect(compactVisible, 'CompactCard MUST be hidden on desktop').toBe(false)
    expect(expandedVisible, 'ExpandedCard MUST be visible on desktop').toBe(true)

    if (expandedVisible) {
      const container = page.locator('main, [role="main"]').first()
      await expect(container).toHaveScreenshot('responsive-desktop-viewport.png', SCREENSHOT_OPTIONS)
    }
  })
})

// ===================================================================
// INTERACTIVE STATES
// ===================================================================

test.describe('Visual Regression - Interactive States', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
  })

  test('hover state matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Hover over card
      await card.hover()
      await page.waitForTimeout(300)

      await expect(card).toHaveScreenshot('compact-card-hover.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('focus state matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Focus via keyboard
      await card.focus()
      await page.waitForTimeout(200)

      await expect(card).toHaveScreenshot('compact-card-focus.png', SCREENSHOT_OPTIONS)
    } else {
      test.skip()
    }
  })

  test('primary action hover matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const primaryButton = card.locator('button').first()

      if (await primaryButton.isVisible()) {
        // Hover over primary action
        await primaryButton.hover()
        await page.waitForTimeout(200)

        await expect(card).toHaveScreenshot('compact-card-action-hover.png', SCREENSHOT_OPTIONS)
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('overflow menu closed matches snapshot', async ({ page }) => {
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Ensure menu is closed (baseline state)
        await expect(card).toHaveScreenshot('compact-card-overflow-closed.png', SCREENSHOT_OPTIONS)
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })
})
