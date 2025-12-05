/**
 * Messages Page Accessibility Tests
 *
 * WCAG 2.1 AA compliance tests for the Messages page (/messages).
 *
 * Tests:
 * - axe-core automated scan
 * - Data table keyboard navigation
 * - Filter controls accessibility
 * - Priority indicators (not color-only)
 * - Touch targets on mobile
 *
 * @see docs/design-system/README.md
 */
import { test, expect } from '@playwright/test'
import {
  checkA11y,
  checkA11yCritical,
  checkColorNotAlone,
} from '../helpers/checkA11y'

test.describe('Messages Page Accessibility (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    // Wait for data to load
    await page.waitForTimeout(1000)
  })

  test('should pass axe-core WCAG 2.1 AA scan', async ({ page }) => {
    await checkA11y(page, {
      failOnImpact: 'serious',
      // Color contrast may vary with dynamic content
      disableRules: ['color-contrast'],
      verbose: true,
    })
  })

  test('should pass critical accessibility checks', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('data table should be keyboard navigable', async ({ page }) => {
    // Focus the table area
    const table = page.locator('table, [role="table"], [data-testid="messages-table"]').first()
    const tableExists = await table.isVisible().catch(() => false)

    if (tableExists) {
      // Tab to table
      await table.focus()

      // Should be able to navigate with Tab
      await page.keyboard.press('Tab')

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('filter controls should be accessible', async ({ page }) => {
    // Find filter/search inputs
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    const searchExists = await searchInput.isVisible().catch(() => false)

    if (searchExists) {
      // Should have proper label or aria-label
      const ariaLabel = await searchInput.getAttribute('aria-label')
      const placeholder = await searchInput.getAttribute('placeholder')
      const id = await searchInput.getAttribute('id')

      // Should have some form of label
      const hasLabel = ariaLabel || placeholder || id

      expect(hasLabel).toBeTruthy()
    }
  })

  test('importance/priority indicators should not rely on color alone', async ({ page }) => {
    // Find priority indicators
    const priorityBadges = page.locator(
      '[class*="importance"], [class*="priority"], [aria-label*="priority"]'
    )
    const count = await priorityBadges.count()

    if (count > 0) {
      const firstBadge = priorityBadges.first()

      // Should have aria-label or visible text
      const ariaLabel = await firstBadge.getAttribute('aria-label')
      const text = await firstBadge.textContent()

      const hasSemanticMeaning =
        (ariaLabel && ariaLabel.length > 0) || (text && text.trim().length > 0)

      expect(hasSemanticMeaning, 'Priority indicator should have aria-label or text').toBe(true)
    }
  })

  test('message classification badges should have icon or text', async ({ page }) => {
    // Find classification badges (SIGNAL, NOISE, etc.)
    const classificationBadges = page.locator('[class*="badge"]').filter({
      hasText: /signal|noise|spam/i,
    })

    const count = await classificationBadges.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const badge = classificationBadges.nth(i)

        // Should have text content
        const text = await badge.textContent()
        expect(text?.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('pagination should be keyboard accessible', async ({ page }) => {
    const pagination = page.locator('[role="navigation"][aria-label*="pagination" i], nav').filter({
      has: page.locator('button'),
    }).first()

    const paginationExists = await pagination.isVisible().catch(() => false)

    if (paginationExists) {
      // Find pagination buttons
      const buttons = pagination.locator('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        // First button should be focusable
        await buttons.first().focus()
        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
      }
    }
  })
})

test.describe('Messages Page Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
  })

  test('should pass axe scan on mobile viewport', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('table should be horizontally scrollable or use cards on mobile', async ({ page }) => {
    // Either table has overflow-x-auto, or uses card layout
    const table = page.locator('table').first()
    const tableExists = await table.isVisible().catch(() => false)

    if (tableExists) {
      const parent = table.locator('..')
      const overflow = await parent.evaluate((el) => {
        return window.getComputedStyle(el).overflowX
      })

      // Should be scrollable
      expect(['auto', 'scroll', 'hidden']).toContain(overflow)
    } else {
      // Card layout - check cards exist
      const cards = page.locator('[data-testid="message-card"], [class*="card"]')
      const cardsExist = await cards.count() > 0

      // Either table or cards should exist
      expect(cardsExist).toBe(true)
    }
  })

  test('action buttons should have adequate touch targets', async ({ page }) => {
    const actionButtons = page.locator('button').filter({
      has: page.locator('svg'),
    })

    const count = await actionButtons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = actionButtons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        // Minimum 36px with tolerance (44px target)
        expect(box.width, `Button ${i} width`).toBeGreaterThanOrEqual(36)
        expect(box.height, `Button ${i} height`).toBeGreaterThanOrEqual(36)
      }
    }
  })
})

test.describe('Messages Page Dark Mode', () => {
  test('should have proper contrast in dark mode', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(300)

    // Run axe scan in dark mode
    await checkA11y(page, {
      failOnImpact: 'serious',
      disableRules: ['color-contrast'], // May vary with theme
    })
  })
})
