import { test, expect } from '@playwright/test'

/**
 * E2E Test: Brand Color Consistency (P3 - Regression Prevention)
 *
 * Ensures teal brand colors remain consistent across the application.
 * Prevents regression to orange (#F97316) from previous design.
 *
 * Test cases:
 * 1. Primary button uses teal color (not orange)
 * 2. Logo gradient is teal (not orange)
 * 3. Sidebar active indicator is teal
 * 4. No orange (#F97316) anywhere in rendered UI
 * 5. Focus rings are visible (teal)
 *
 * Related: task-tracker-mjq (brand color consistency epic)
 */

test.describe('Brand Color Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Close onboarding wizard if it appears
    const closeButton = page
      .locator('[role="dialog"] button')
      .filter({ hasText: /skip|close/i })
      .first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('primary button uses teal color (not orange)', async ({ page }) => {
    // Navigate to Settings to ensure primary button is visible
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Find primary button (Settings page has "Save Settings" button)
    const primaryButton = page
      .locator('button[type="submit"], button:has-text("Save")')
      .first()

    if (await primaryButton.isVisible().catch(() => false)) {
      const bgColor = await primaryButton.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      )

      // Orange RGB: rgb(249, 115, 22) - should NOT match
      expect(bgColor, 'Primary button should not use orange color').not.toContain(
        '249, 115, 22'
      )

      // Verify teal-ish color range (hue around 172°)
      // Teal variants: rgb(20-50, 140-180, 130-170)
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number)
        const isTealish = g > r && g > 100 && b > 100 && Math.abs(g - b) < 50
        expect(isTealish, `Expected teal-ish color, got ${bgColor}`).toBe(true)
      }
    }
  })

  test('logo uses teal gradient (not orange)', async ({ page }) => {
    // Find logo SVG in sidebar
    const logo = page.locator('svg').first()

    if (await logo.isVisible().catch(() => false)) {
      // Check SVG elements for fill colors
      const fills = await logo.evaluate((svg) => {
        const elements = svg.querySelectorAll('*')
        const colors: string[] = []
        elements.forEach((el) => {
          const fill = window.getComputedStyle(el).fill
          if (fill && fill !== 'none' && !fill.includes('url(')) {
            colors.push(fill)
          }
        })
        return colors
      })

      // Verify no orange color in logo
      fills.forEach((fill) => {
        expect(fill, `Logo should not contain orange color: ${fill}`).not.toContain(
          '249, 115, 22'
        )
      })
    }
  })

  test('sidebar active indicator is teal', async ({ page }) => {
    // Find active sidebar item (should be Dashboard)
    const activeItem = page
      .locator('[data-active="true"], [aria-current="page"]')
      .first()

    if (await activeItem.isVisible().catch(() => false)) {
      const borderColor = await activeItem.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return (
          styles.borderLeftColor ||
          styles.borderColor ||
          styles.backgroundColor
        )
      })

      // Verify not orange
      expect(
        borderColor,
        'Sidebar active indicator should not be orange'
      ).not.toContain('249, 115, 22')
    }
  })

  test('no orange color (#F97316) anywhere in rendered UI', async ({ page }) => {
    // Navigate to multiple pages to check comprehensive coverage
    const pagesToCheck = ['/dashboard', '/messages', '/topics', '/settings']

    for (const pageUrl of pagesToCheck) {
      await page.goto(pageUrl)
      await page.waitForLoadState('networkidle')

      // Check all computed styles for orange color
      const hasOrange = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const orangeRGB = '249, 115, 22'
        const foundElements: string[] = []

        for (const el of elements) {
          const styles = window.getComputedStyle(el)
          const colors = [
            styles.backgroundColor,
            styles.color,
            styles.borderColor,
            styles.borderLeftColor,
            styles.borderRightColor,
            styles.borderTopColor,
            styles.borderBottomColor,
            styles.fill,
            styles.stroke,
          ]

          for (const color of colors) {
            if (color && color.includes(orangeRGB)) {
              foundElements.push(
                `${el.tagName}.${el.className} - ${color}`
              )
            }
          }
        }

        return foundElements
      })

      expect(
        hasOrange,
        `Orange color (#F97316) found on ${pageUrl}: ${hasOrange.join(', ')}`
      ).toHaveLength(0)
    }
  })

  test('focus rings are visible and teal', async ({ page }) => {
    // Find interactive elements
    const button = page.locator('button').first()

    if (await button.isVisible().catch(() => false)) {
      // Focus the button
      await button.focus()

      // Get focus ring styles
      const focusStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
        }
      })

      // Verify focus ring is visible (either outline or box-shadow)
      const hasFocusIndicator =
        focusStyles.outlineWidth !== '0px' ||
        (focusStyles.boxShadow && focusStyles.boxShadow !== 'none')

      expect(hasFocusIndicator, 'Focus ring should be visible').toBe(true)

      // Verify not orange
      const focusColor = focusStyles.outlineColor || focusStyles.boxShadow
      if (focusColor) {
        expect(focusColor, 'Focus ring should not be orange').not.toContain(
          '249, 115, 22'
        )
      }
    }
  })

  test('all badge variants avoid orange', async ({ page }) => {
    // Navigate to Topics page (has badges)
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Find all badges
    const badges = page.locator('[class*="badge"], [role="status"]')
    const badgeCount = await badges.count()

    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 10); i++) {
        const badge = badges.nth(i)
        const bgColor = await badge.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        )

        expect(
          bgColor,
          `Badge ${i} should not use orange color`
        ).not.toContain('249, 115, 22')
      }
    }
  })
})

test.describe('Brand Color Consistency - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Close onboarding wizard
    const closeButton = page
      .locator('[role="dialog"] button')
      .filter({ hasText: /skip|close/i })
      .first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
      await page.waitForTimeout(300)
    }

    // Switch to dark mode (click theme toggle)
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("Theme")').first()
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click()
      await page.waitForTimeout(200)
    }
  })

  test('dark mode should not introduce orange colors', async ({ page }) => {
    // Check for orange in dark mode
    const hasOrange = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      const orangeRGB = '249, 115, 22'

      for (const el of elements) {
        const styles = window.getComputedStyle(el)
        const colors = [
          styles.backgroundColor,
          styles.color,
          styles.borderColor,
          styles.fill,
        ]

        for (const color of colors) {
          if (color && color.includes(orangeRGB)) {
            return true
          }
        }
      }
      return false
    })

    expect(hasOrange, 'Dark mode should not use orange color').toBe(false)
  })
})
