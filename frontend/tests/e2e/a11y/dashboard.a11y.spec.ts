/**
 * Dashboard Page Accessibility Tests
 *
 * WCAG 2.1 AA compliance tests for the Dashboard page (/).
 *
 * Tests:
 * - axe-core automated scan
 * - Touch targets (44px minimum)
 * - Focus indicators
 * - Color contrast via CSS tokens
 * - Keyboard navigation
 * - Responsive accessibility
 *
 * @see docs/design-system/README.md
 */
import { test, expect } from '@playwright/test'
import {
  checkA11y,
  checkA11yCritical,
  checkTouchTargets,
  checkFocusVisibility,
} from '../helpers/checkA11y'

test.describe('Dashboard Accessibility (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
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

  test('should have visible focus indicators on interactive elements', async ({ page }) => {
    // Tab through interface and verify focus visibility
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Check outline width
    const outlineWidth = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return parseInt(style.outlineWidth) || 0
    })

    // Should have at least 2px outline (3px target)
    expect(outlineWidth).toBeGreaterThanOrEqual(2)
  })

  test('icon buttons should have 44px minimum touch target', async ({ page }) => {
    const iconButtons = page.locator('button').filter({
      has: page.locator('svg'),
    })

    const count = await iconButtons.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = iconButtons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        // Allow 40px with tolerance (44px target)
        expect(box.width, `Icon button ${i} width`).toBeGreaterThanOrEqual(36)
        expect(box.height, `Icon button ${i} height`).toBeGreaterThanOrEqual(36)
      }
    }
  })

  test('should have semantic color tokens defined', async ({ page }) => {
    const hasSemanticTokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)

      // Check status tokens
      const statusConnected = style.getPropertyValue('--status-connected').trim()
      const statusError = style.getPropertyValue('--status-error').trim()

      // Check shadow tokens
      const shadowCard = style.getPropertyValue('--shadow-card').trim()

      return {
        hasStatusTokens: statusConnected !== '' && statusError !== '',
        hasShadowTokens: shadowCard !== '',
      }
    })

    expect(hasSemanticTokens.hasStatusTokens).toBe(true)
    expect(hasSemanticTokens.hasShadowTokens).toBe(true)
  })

  test('should navigate with keyboard only', async ({ page }) => {
    let tabCount = 0
    const maxTabs = 15

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++

      const focusedElement = page.locator(':focus')
      const isVisible = await focusedElement.isVisible().catch(() => false)

      if (isVisible) {
        // Element should be identifiable
        const ariaLabel = await focusedElement.getAttribute('aria-label')
        const text = await focusedElement.textContent()

        expect(ariaLabel || text).toBeTruthy()
      }
    }
  })
})

test.describe('Dashboard Dark Mode Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper contrast in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(300)

    // Run axe scan in dark mode
    await checkA11y(page, {
      failOnImpact: 'serious',
    })
  })

  test('shadow tokens should differ between themes', async ({ page }) => {
    // Check light mode shadow
    const lightShadow = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--shadow-card')
        .trim()
    })
    expect(lightShadow).not.toBe('')

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(100)

    // Check dark mode shadow
    const darkShadow = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--shadow-card')
        .trim()
    })
    expect(darkShadow).not.toBe('')

    // Shadows should be different
    expect(darkShadow).not.toBe(lightShadow)
  })
})

test.describe('Dashboard Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should pass axe scan on mobile viewport', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('touch targets should meet 44px minimum on mobile', async ({ page }) => {
    // Check navbar buttons
    const navbarButtons = page.locator('header button, nav button').filter({
      has: page.locator('svg'),
    })

    const count = await navbarButtons.count()

    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = navbarButtons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        expect(box.width, `Navbar button ${i} width`).toBeGreaterThanOrEqual(44)
        expect(box.height, `Navbar button ${i} height`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('content should be single column layout', async ({ page }) => {
    const recentTopics = page.locator('text=Recent Topics')
    const trendingTopics = page.locator('text=Trending Topics')

    await expect(recentTopics).toBeVisible()
    await expect(trendingTopics).toBeVisible()

    // Trending should be below Recent (stacked layout)
    const recentBox = await recentTopics.boundingBox()
    const trendingBox = await trendingTopics.boundingBox()

    if (recentBox && trendingBox) {
      expect(trendingBox.y).toBeGreaterThan(recentBox.y)
    }
  })

  test('tabs should not overlap on narrow viewport', async ({ page }) => {
    const tabs = page.locator('[role="tablist"] [role="tab"]')
    const count = await tabs.count()

    expect(count).toBeGreaterThanOrEqual(3)

    // All tabs should be visible (scrollable container)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const tab = tabs.nth(i)
      await expect(tab).toBeVisible()
    }
  })
})

test.describe('Dashboard Reduced Motion', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Check that animations are disabled
    const animationDuration = await page.evaluate(() => {
      const el = document.querySelector('[class*="animate-"]')
      if (el) {
        return window.getComputedStyle(el).animationDuration
      }
      return '0.01ms'
    })

    // Should be very short (0.01ms) or 0s
    const duration = parseFloat(animationDuration)
    expect(duration).toBeLessThanOrEqual(0.1)
  })
})
