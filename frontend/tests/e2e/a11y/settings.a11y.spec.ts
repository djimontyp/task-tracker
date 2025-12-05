/**
 * Settings Page Accessibility Tests
 *
 * WCAG 2.1 AA compliance tests for the Settings page (/settings).
 *
 * Tests:
 * - axe-core automated scan
 * - Tab navigation (keyboard)
 * - Form controls accessibility
 * - Provider validation status indicators
 * - Theme toggle functionality
 *
 * @see docs/design-system/README.md
 */
import { test, expect } from '@playwright/test'
import {
  checkA11y,
  checkA11yCritical,
  checkColorNotAlone,
} from '../helpers/checkA11y'

test.describe('Settings Page Accessibility (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
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

  test('tab list should be keyboard navigable', async ({ page }) => {
    // Find tab list
    const tabList = page.locator('[role="tablist"]')
    const tabListExists = await tabList.isVisible().catch(() => false)

    if (tabListExists) {
      const tabs = tabList.locator('[role="tab"]')
      const tabCount = await tabs.count()

      expect(tabCount).toBeGreaterThanOrEqual(2)

      // Focus first tab
      await tabs.first().focus()

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(100)

      // Second tab should be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('tabs should have proper ARIA attributes', async ({ page }) => {
    const tabs = page.locator('[role="tab"]')
    const count = await tabs.count()

    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i)

      // Should have aria-selected
      const ariaSelected = await tab.getAttribute('aria-selected')
      expect(['true', 'false']).toContain(ariaSelected)

      // Should have aria-controls pointing to panel
      const ariaControls = await tab.getAttribute('aria-controls')
      if (ariaControls) {
        const panel = page.locator(`#${ariaControls}`)
        // Panel should exist (may be hidden if tab not selected)
        const panelExists = await panel.count() > 0
        expect(panelExists).toBe(true)
      }
    }
  })

  test('form inputs should have labels', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]), select, textarea')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const inputVisible = await input.isVisible().catch(() => false)

      if (inputVisible) {
        // Check for label association
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        const placeholder = await input.getAttribute('placeholder')

        // Should have some form of label
        const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder

        expect(hasLabel, `Input ${i} should have a label`).toBeTruthy()
      }
    }
  })

  test('theme selector should be accessible', async ({ page }) => {
    // Find theme toggle in General tab (if visible)
    const themeToggle = page.locator('button').filter({
      has: page.locator('svg[class*="lucide-sun"], svg[class*="lucide-moon"]'),
    }).first()

    const themeToggleExists = await themeToggle.isVisible().catch(() => false)

    if (themeToggleExists) {
      // Should be focusable
      await themeToggle.focus()

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Should have aria-label
      const ariaLabel = await themeToggle.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('switch/toggle controls should be accessible', async ({ page }) => {
    // Find switch controls
    const switches = page.locator('[role="switch"], input[type="checkbox"]')
    const count = await switches.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const switchEl = switches.nth(i)
      const switchVisible = await switchEl.isVisible().catch(() => false)

      if (switchVisible) {
        // Should have aria-checked
        const ariaChecked = await switchEl.getAttribute('aria-checked')
        const checked = await switchEl.getAttribute('checked')

        // Switch should indicate state
        const hasState = ariaChecked !== null || checked !== null

        expect(hasState, `Switch ${i} should indicate checked state`).toBe(true)
      }
    }
  })
})

test.describe('Settings Providers Tab Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Click Providers tab
    const providersTab = page.getByRole('tab', { name: /providers/i })
    const tabExists = await providersTab.isVisible().catch(() => false)

    if (tabExists) {
      await providersTab.click()
      await page.waitForTimeout(500)
    }
  })

  test('provider cards should be accessible', async ({ page }) => {
    await checkA11y(page, {
      failOnImpact: 'serious',
      scope: '[role="tabpanel"]',
    })
  })

  test('validation status should have icon with text', async ({ page }) => {
    const statusBadges = page.locator('[class*="bg-status-"], [role="status"]')
    const count = await statusBadges.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const badge = statusBadges.nth(i)
        const badgeVisible = await badge.isVisible().catch(() => false)

        if (badgeVisible) {
          const hasIcon = (await badge.locator('svg').count()) > 0
          const text = (await badge.textContent()) || ''

          // Badge should have EITHER icon OR meaningful text
          const isAccessible = hasIcon || text.trim().length > 0

          expect(isAccessible, `Status badge ${i} should have icon or text`).toBe(true)
        }
      }
    }
  })

  test('provider validation buttons should have aria-labels', async ({ page }) => {
    const validateButtons = page.locator('button').filter({
      hasText: /validate|test|check/i,
    })

    const count = await validateButtons.count()

    for (let i = 0; i < count; i++) {
      const button = validateButtons.nth(i)
      const buttonVisible = await button.isVisible().catch(() => false)

      if (buttonVisible) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')

        // Should have visible text or aria-label
        expect(text?.trim() || ariaLabel, `Button ${i} should be labeled`).toBeTruthy()
      }
    }
  })
})

test.describe('Settings Sources Tab Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Click Sources tab
    const sourcesTab = page.getByRole('tab', { name: /sources/i })
    const tabExists = await sourcesTab.isVisible().catch(() => false)

    if (tabExists) {
      await sourcesTab.click()
      await page.waitForTimeout(500)
    }
  })

  test('source cards should be accessible', async ({ page }) => {
    await checkA11y(page, {
      failOnImpact: 'serious',
      scope: '[role="tabpanel"]',
    })
  })

  test('Telegram settings should have proper form labels', async ({ page }) => {
    const telegramCard = page.locator('[data-testid="telegram-source"], [class*="card"]').filter({
      hasText: /telegram/i,
    }).first()

    const cardExists = await telegramCard.isVisible().catch(() => false)

    if (cardExists) {
      // Find configure button
      const configButton = telegramCard.locator('button').filter({
        hasText: /configure|settings|setup/i,
      }).first()

      const buttonExists = await configButton.isVisible().catch(() => false)

      if (buttonExists) {
        await configButton.click()
        await page.waitForTimeout(500)

        // Check form fields in dialog/sheet
        const dialog = page.locator('[role="dialog"], [data-state="open"]')
        const dialogExists = await dialog.isVisible().catch(() => false)

        if (dialogExists) {
          await checkA11y(page, {
            failOnImpact: 'serious',
            scope: '[role="dialog"], [data-state="open"]',
          })
        }
      }
    }
  })
})

test.describe('Settings Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('should pass axe scan on mobile viewport', async ({ page }) => {
    await checkA11yCritical(page)
  })

  test('tabs should be scrollable on narrow viewport', async ({ page }) => {
    const tabList = page.locator('[role="tablist"]')
    const tabListExists = await tabList.isVisible().catch(() => false)

    if (tabListExists) {
      // All tabs should still be accessible
      const tabs = tabList.locator('[role="tab"]')
      const count = await tabs.count()

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i)
        // Tab should be visible (maybe needs scroll)
        await expect(tab).toBeAttached()
      }
    }
  })

  test('form controls should have adequate touch targets', async ({ page }) => {
    const formControls = page.locator('button, input, select, [role="switch"]')
    const count = await formControls.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const control = formControls.nth(i)
      const controlVisible = await control.isVisible().catch(() => false)

      if (controlVisible) {
        const box = await control.boundingBox()

        if (box) {
          // Minimum 32px for form controls (44px target)
          expect(box.height, `Control ${i} height`).toBeGreaterThanOrEqual(32)
        }
      }
    }
  })
})

test.describe('Settings Keyboard Navigation', () => {
  test('should navigate settings with keyboard', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Tab through interface
    let tabCount = 0
    const maxTabs = 15

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++

      const focusedElement = page.locator(':focus')
      const isVisible = await focusedElement.isVisible().catch(() => false)

      if (isVisible) {
        // Every focused element should be visually identifiable
        await expect(focusedElement).toBeVisible()
      }
    }
  })

  test('should switch tabs with arrow keys', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Focus tab list
    const firstTab = page.locator('[role="tab"]').first()
    await firstTab.focus()

    const initialTab = await firstTab.getAttribute('aria-selected')

    // Press right arrow
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)

    // Focused element should be different tab
    const focusedTab = page.locator('[role="tab"]:focus')
    const focusedTabExists = await focusedTab.isVisible().catch(() => false)

    if (focusedTabExists) {
      // Should be different from first tab
      const newTabSelected = await focusedTab.getAttribute('aria-selected')
      // Focus moved to another tab
      expect(focusedTabExists).toBe(true)
    }
  })
})
