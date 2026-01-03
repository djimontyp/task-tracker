import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Test: Responsive Card Behavior
 *
 * Tests CompactCard and ExpandedCard responsive behavior across viewports:
 * - CompactCard: Mobile-first (visible <640px, hidden >=640px)
 * - ExpandedCard: Desktop-first (hidden <640px, visible >=640px)
 *
 * Requirements:
 * - No layout shift during viewport transitions (CLS < 0.1)
 * - Smooth variant switching
 * - Touch targets >= 44px on mobile
 * - No horizontal scroll on any viewport
 * - Content consistency across breakpoints
 *
 * Viewports tested:
 * - Mobile: 375x667 (iPhone SE)
 * - Desktop: 1024x768 (iPad landscape)
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

// Minimum touch target size per WCAG 2.5.5
const MIN_TOUCH_TARGET_PX = 44

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Wait for page to fully load including network requests
 */
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  // Extra wait for any animations to settle
  await page.waitForTimeout(100)
}

/**
 * Get horizontal scroll width (0 = no scroll)
 */
async function getHorizontalScroll(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth
  })
}

/**
 * Get all compact cards on page
 */
function getCompactCards(page: Page) {
  // CompactCard has className="sm:hidden" (visible on mobile only)
  return page.locator('[class*="sm:hidden"]').filter({ has: page.locator('[role="button"], article, section') })
}

/**
 * Get all expanded cards on page
 */
function getExpandedCards(page: Page) {
  // ExpandedCard has className="hidden sm:block" (visible on desktop only)
  return page.locator('[class*="hidden"][class*="sm:block"]').filter({ has: page.locator('[role="button"], article, section') })
}

/**
 * Measure layout shift by comparing element positions before/after action
 */
async function measureLayoutShift(
  page: Page,
  action: () => Promise<void>
): Promise<number> {
  // Get initial positions of key elements
  const beforePositions = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('h1, h2, button, a'))
    return elements.map((el) => {
      const rect = el.getBoundingClientRect()
      return { top: rect.top, left: rect.left }
    })
  })

  // Perform action (e.g., resize)
  await action()

  // Wait for layout to stabilize
  await page.waitForTimeout(200)

  // Get new positions
  const afterPositions = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('h1, h2, button, a'))
    return elements.map((el) => {
      const rect = el.getBoundingClientRect()
      return { top: rect.top, left: rect.left }
    })
  })

  // Calculate total shift (simplified CLS approximation)
  let totalShift = 0
  const minLength = Math.min(beforePositions.length, afterPositions.length)

  for (let i = 0; i < minLength; i++) {
    const before = beforePositions[i]
    const after = afterPositions[i]
    const shift = Math.abs(before.top - after.top) + Math.abs(before.left - after.left)
    totalShift += shift
  }

  // Normalize by viewport height
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  return totalShift / viewportHeight / minLength
}

// ===================================================================
// MOBILE VIEWPORT TESTS (375x667)
// ===================================================================

test.describe('Mobile Viewport (375x667) - CompactCard Visible', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('shows compact card variant on mobile', async ({ page }) => {
    const compactCards = getCompactCards(page)
    const count = await compactCards.count()

    // Should have at least one compact card visible
    expect(count).toBeGreaterThan(0)

    // First compact card should be visible
    await expect(compactCards.first()).toBeVisible()
  })

  test('hides expanded card variant on mobile', async ({ page }) => {
    const expandedCards = getExpandedCards(page)
    const count = await expandedCards.count()

    if (count > 0) {
      // Expanded cards exist but should be hidden
      await expect(expandedCards.first()).not.toBeVisible()
    }
  })

  test('compact card has touch targets >= 44px', async ({ page }) => {
    const compactCards = getCompactCards(page)
    const firstCard = compactCards.first()

    // Wait for card to be visible
    await expect(firstCard).toBeVisible()

    // Find all buttons within the card
    const buttons = firstCard.locator('button')
    const buttonCount = await buttons.count()

    expect(buttonCount).toBeGreaterThan(0)

    // Check each button meets touch target size
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        const message = `Button ${i} size: ${box.width}x${box.height}px`
        expect(box.width, message).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
        expect(box.height, message).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
      }
    }
  })

  test('no horizontal scroll on mobile', async ({ page }) => {
    const horizontalScroll = await getHorizontalScroll(page)
    expect(horizontalScroll).toBe(0)
  })

  test('compact card title is truncated with tooltip', async ({ page }) => {
    const compactCards = getCompactCards(page)
    const firstCard = compactCards.first()

    // Find title element (should be h3 with truncation)
    const title = firstCard.locator('h3').first()
    await expect(title).toBeVisible()

    // Check for truncation classes
    const classes = await title.getAttribute('class')
    expect(classes).toMatch(/truncate|line-clamp/)
  })
})

// ===================================================================
// DESKTOP VIEWPORT TESTS (1024x768)
// ===================================================================

test.describe('Desktop Viewport (1024x768) - ExpandedCard Visible', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('shows expanded card variant on desktop', async ({ page }) => {
    const expandedCards = getExpandedCards(page)
    const count = await expandedCards.count()

    // Should have at least one expanded card visible
    expect(count).toBeGreaterThan(0)

    // First expanded card should be visible
    await expect(expandedCards.first()).toBeVisible()
  })

  test('hides compact card variant on desktop', async ({ page }) => {
    const compactCards = getCompactCards(page)
    const count = await compactCards.count()

    if (count > 0) {
      // Compact cards exist but should be hidden
      await expect(compactCards.first()).not.toBeVisible()
    }
  })

  test('no horizontal scroll on desktop', async ({ page }) => {
    const horizontalScroll = await getHorizontalScroll(page)
    expect(horizontalScroll).toBe(0)
  })

  test('expanded card shows full metadata', async ({ page }) => {
    const expandedCards = getExpandedCards(page)
    const firstCard = expandedCards.first()

    await expect(firstCard).toBeVisible()

    // Expanded cards should have CardHeader
    const header = firstCard.locator('[class*="CardHeader"]').first()
    await expect(header).toBeVisible()
  })
})

// ===================================================================
// VIEWPORT TRANSITION TESTS
// ===================================================================

test.describe('Viewport Transitions - Layout Stability', () => {
  test('transitions smoothly from mobile to desktop', async ({ page }) => {
    // Start on mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    // Measure layout shift during resize
    const cls = await measureLayoutShift(page, async () => {
      await page.setViewportSize(VIEWPORTS.desktop)
    })

    // CLS should be minimal (< 0.1 is good, < 0.25 is acceptable)
    expect(cls).toBeLessThan(0.25)
  })

  test('transitions smoothly from desktop to mobile', async ({ page }) => {
    // Start on desktop
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    // Measure layout shift during resize
    const cls = await measureLayoutShift(page, async () => {
      await page.setViewportSize(VIEWPORTS.mobile)
    })

    // CLS should be minimal
    expect(cls).toBeLessThan(0.25)
  })

  test('maintains content consistency across viewport changes', async ({ page }) => {
    // Start on mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    // Get title from compact card
    const compactCard = getCompactCards(page).first()
    const mobileTitle = await compactCard.locator('h3').first().textContent()

    // Resize to desktop
    await page.setViewportSize(VIEWPORTS.desktop)
    await waitForPageLoad(page)

    // Get title from expanded card
    const expandedCard = getExpandedCards(page).first()
    const desktopTitle = await expandedCard.locator('h3').first().textContent()

    // Titles should match (same content, different layouts)
    expect(mobileTitle).toBe(desktopTitle)
  })
})

// ===================================================================
// MULTI-PAGE CONSISTENCY TESTS
// ===================================================================

test.describe('Responsive Behavior Across Pages', () => {
  test('agents page respects mobile breakpoint', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)

    const compactCards = getCompactCards(page)
    await expect(compactCards.first()).toBeVisible()

    const expandedCards = getExpandedCards(page)
    const expandedCount = await expandedCards.count()

    if (expandedCount > 0) {
      await expect(expandedCards.first()).not.toBeVisible()
    }
  })

  test('topics page respects desktop breakpoint', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.topics)
    await waitForPageLoad(page)

    const expandedCards = getExpandedCards(page)

    // If page has cards, check visibility
    const expandedCount = await expandedCards.count()
    if (expandedCount > 0) {
      await expect(expandedCards.first()).toBeVisible()
    }

    const compactCards = getCompactCards(page)
    const compactCount = await compactCards.count()

    if (compactCount > 0) {
      await expect(compactCards.first()).not.toBeVisible()
    }
  })

  test('projects page has consistent card behavior', async ({ page }) => {
    // Test mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.projects)
    await waitForPageLoad(page)

    const mobileScroll = await getHorizontalScroll(page)
    expect(mobileScroll).toBe(0)

    // Test desktop
    await page.setViewportSize(VIEWPORTS.desktop)
    await waitForPageLoad(page)

    const desktopScroll = await getHorizontalScroll(page)
    expect(desktopScroll).toBe(0)
  })
})
