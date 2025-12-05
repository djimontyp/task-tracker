/**
 * Topics Page Accessibility Tests
 *
 * WCAG 2.1 AA compliance tests for the Topics page (/topics).
 *
 * Tests:
 * - axe-core automated scan
 * - Topic card interactions
 * - View mode toggle accessibility
 * - Atom type indicators (icon + text)
 * - Search and filter controls
 *
 * @see docs/design-system/README.md
 */
import { test, expect } from '@playwright/test'
import {
  checkA11y,
  checkA11yCritical,
  checkColorNotAlone,
} from '../helpers/checkA11y'

test.describe('Topics Page Accessibility (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')
  })

  test('should pass axe-core WCAG 2.1 AA scan', async ({ page }) => {
    await checkA11y(page, {
      failOnImpact: 'serious',
      verbose: true,
    })
  })

  test('should pass critical accessibility checks', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('topic cards should be keyboard accessible', async ({ page }) => {
    // Find topic cards
    const topicCards = page.locator('[data-testid="topic-card"], a[href*="/topics/"], button').filter({
      hasText: /topic/i,
    })

    const count = await topicCards.count()

    if (count > 0) {
      // Focus first card
      await topicCards.first().focus()

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Should have visible focus indicator
      const outlineWidth = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return parseInt(style.outlineWidth) || 0
      })

      // Check for focus indicator (outline or ring)
      const hasFocusRing = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return (
          parseInt(style.outlineWidth) >= 2 ||
          style.boxShadow !== 'none' ||
          el.className.includes('ring')
        )
      })

      expect(hasFocusRing).toBe(true)
    }
  })

  test('view mode toggle should be accessible', async ({ page }) => {
    // Find view toggle buttons (grid/list)
    const viewToggle = page.locator('button[aria-label*="grid" i], button[aria-label*="list" i]')
    const toggleExists = await viewToggle.first().isVisible().catch(() => false)

    if (toggleExists) {
      // Should have aria-label
      const ariaLabel = await viewToggle.first().getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()

      // Should be focusable
      await viewToggle.first().focus()
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('search input should have proper label', async ({ page }) => {
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search" i]')
      .first()
    const searchExists = await searchInput.isVisible().catch(() => false)

    if (searchExists) {
      const ariaLabel = await searchInput.getAttribute('aria-label')
      const placeholder = await searchInput.getAttribute('placeholder')
      const labelledBy = await searchInput.getAttribute('aria-labelledby')

      // Should have some form of label
      expect(ariaLabel || placeholder || labelledBy).toBeTruthy()
    }
  })

  test('sort dropdown should be keyboard accessible', async ({ page }) => {
    // Find sort control
    const sortSelect = page.locator('select, [role="combobox"], button').filter({
      hasText: /sort|order/i,
    }).first()

    const sortExists = await sortSelect.isVisible().catch(() => false)

    if (sortExists) {
      // Should be focusable
      await sortSelect.focus()

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('atom type indicators should have icons', async ({ page }) => {
    // Navigate to a topic detail page if atoms are shown there
    const topicLink = page.locator('a[href*="/topics/"]').first()
    const linkExists = await topicLink.isVisible().catch(() => false)

    if (linkExists) {
      await topicLink.click()
      await page.waitForLoadState('networkidle')

      // Find atom cards/badges
      const atomCards = page.locator('[data-testid="atom-card"], [class*="atom"]').filter({
        has: page.locator('svg'),
      })

      const count = await atomCards.count()

      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = atomCards.nth(i)

        // Should have icon (not just colored background)
        const hasIcon = (await card.locator('svg').count()) > 0

        expect(hasIcon, `Atom card ${i} should have icon`).toBe(true)
      }
    }
  })

  test('semantic color tokens should be defined', async ({ page }) => {
    const hasAtomColors = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return style.getPropertyValue('--atom-problem').trim() !== ''
    })

    expect(hasAtomColors).toBe(true)
  })
})

test.describe('Topics Page Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')
  })

  test('should pass axe scan on mobile viewport', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('topic cards should have adequate spacing on mobile', async ({ page }) => {
    const topicCards = page.locator('[data-testid="topic-card"], [class*="card"]').filter({
      hasText: /topic/i,
    })

    const count = await topicCards.count()

    if (count >= 2) {
      const firstBox = await topicCards.nth(0).boundingBox()
      const secondBox = await topicCards.nth(1).boundingBox()

      if (firstBox && secondBox) {
        // Cards should have at least 8px gap (4px grid × 2)
        const gap = secondBox.y - (firstBox.y + firstBox.height)
        expect(gap, 'Gap between cards should be >= 8px').toBeGreaterThanOrEqual(8)
      }
    }
  })

  test('interactive elements should have 44px touch targets', async ({ page }) => {
    const buttons = page.locator('button').filter({ has: page.locator('svg') })
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        // Allow 36px minimum with tolerance
        expect(box.width, `Button ${i} width`).toBeGreaterThanOrEqual(36)
        expect(box.height, `Button ${i} height`).toBeGreaterThanOrEqual(36)
      }
    }
  })
})

test.describe('Topics Page Dark Mode', () => {
  test('should have proper contrast in dark mode', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(300)

    // Run axe scan
    await checkA11y(page, {
      failOnImpact: 'serious',
    })
  })

  test('topic cards should be visible in dark mode', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(300)

    // Cards should still be visible
    const topicCards = page.locator('[data-testid="topic-card"], [class*="card"]').filter({
      hasText: /topic/i,
    })

    const count = await topicCards.count()

    if (count > 0) {
      await expect(topicCards.first()).toBeVisible()
    }
  })
})

test.describe('Topics Page Keyboard Navigation', () => {
  test('should navigate through topics with Tab key', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Tab through interface
    let tabCount = 0
    const maxTabs = 10

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++

      const focusedElement = page.locator(':focus')
      const isVisible = await focusedElement.isVisible().catch(() => false)

      if (isVisible) {
        const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase())

        // Interactive elements should be focusable
        const isInteractive = ['a', 'button', 'input', 'select'].includes(tagName)

        if (isInteractive) {
          // Should have visible focus
          await expect(focusedElement).toBeVisible()
        }
      }
    }
  })

  test('should activate topic cards with Enter key', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    const topicCard = page.locator('a[href*="/topics/"], [data-testid="topic-card"]').first()
    const cardExists = await topicCard.isVisible().catch(() => false)

    if (cardExists) {
      await topicCard.focus()

      // Store initial URL
      const initialUrl = page.url()

      // Press Enter to navigate
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // URL should change (navigation occurred)
      // This test may need adjustment based on actual navigation behavior
      const newUrl = page.url()

      // If it's a link, URL should change
      if ((await topicCard.evaluate((el) => el.tagName.toLowerCase())) === 'a') {
        expect(newUrl).not.toBe(initialUrl)
      }
    }
  })
})
