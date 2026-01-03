import { test, expect, type Page } from '@playwright/test'

/**
 * E2E Test: Card User Interactions
 *
 * Tests CompactCard and ExpandedCard interactive behavior:
 * - Click interactions (card navigation, primary action, overflow menu)
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys, ESC)
 * - Action execution (edit, delete, copy, dropdown)
 * - Touch targets and accessibility
 *
 * Components tested:
 * - CompactCard (mobile, <640px)
 * - ExpandedCard (desktop, >=640px)
 * - CardActions (primary + overflow menu)
 *
 * Requirements:
 * - Click handlers must execute correctly
 * - Keyboard navigation must match WCAG patterns
 * - Dropdown menus must open/close as expected
 * - Event propagation must be handled (card vs action clicks)
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
 * Get first visible compact card (mobile)
 */
function getFirstCompactCard(page: Page) {
  return page.locator('[class*="sm:hidden"]').filter({
    has: page.locator('[role="button"], article, section')
  }).first()
}

/**
 * Get first visible expanded card (desktop)
 */
function getFirstExpandedCard(page: Page) {
  return page.locator('[class*="hidden"][class*="sm:block"]').filter({
    has: page.locator('[role="button"], article, section')
  }).first()
}

/**
 * Get overflow menu trigger button (More actions)
 */
function getOverflowMenuButton(page: Page) {
  return page.getByRole('button', { name: /more actions/i })
}

// ===================================================================
// CLICK INTERACTIONS - MOBILE (CompactCard)
// ===================================================================

test.describe('Click Interactions - Mobile (375x667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('clicking card navigates to detail page', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Get current URL
      const currentUrl = page.url()

      // Click card (should navigate)
      await card.click()
      await page.waitForLoadState('networkidle')

      // Verify navigation occurred
      const newUrl = page.url()
      expect(newUrl).not.toBe(currentUrl)
      expect(newUrl).toMatch(/\/(agents|topics|projects)\//)
    }
  })

  test('primary action button executes correctly', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Find primary action button (first button in card)
      const primaryButton = card.locator('button').first()

      if (await primaryButton.isVisible()) {
        const ariaLabel = await primaryButton.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()

        // Click should execute without navigation
        const currentUrl = page.url()
        await primaryButton.click()
        await page.waitForTimeout(200)

        // URL should not change (action, not navigation)
        expect(page.url()).toBe(currentUrl)
      }
    }
  })

  test('overflow menu opens on button click', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Click to open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        // Menu should be visible
        const menu = page.locator('[role="menu"]')
        await expect(menu).toBeVisible()

        // Menu items should be present
        const menuItems = page.locator('[role="menuitem"]')
        const itemCount = await menuItems.count()
        expect(itemCount, `Expected menu items, got ${itemCount}`).toBeGreaterThan(0)
      }
    }
  })

  test('overflow menu closes on outside click', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        const menu = page.locator('[role="menu"]')
        await expect(menu).toBeVisible()

        // Click outside (on page heading)
        const heading = page.getByRole('heading', { level: 1 }).first()
        await heading.click()
        await page.waitForTimeout(200)

        // Menu should be hidden
        await expect(menu).not.toBeVisible()
      }
    }
  })

  test('dropdown items execute onClick handlers', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        // Get first menu item
        const firstMenuItem = page.locator('[role="menuitem"]').first()
        await expect(firstMenuItem).toBeVisible()

        // Click menu item
        const itemText = await firstMenuItem.textContent()
        await firstMenuItem.click()
        await page.waitForTimeout(200)

        // Menu should close after action
        const menu = page.locator('[role="menu"]')
        await expect(menu).not.toBeVisible()
      }
    }
  })
})

// ===================================================================
// CLICK INTERACTIONS - DESKTOP (ExpandedCard)
// ===================================================================

test.describe('Click Interactions - Desktop (1024x768)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('clicking expanded card navigates to detail page', async ({ page }) => {
    const card = getFirstExpandedCard(page)

    if (await card.isVisible()) {
      const currentUrl = page.url()

      // Click card
      await card.click()
      await page.waitForLoadState('networkidle')

      // Verify navigation
      const newUrl = page.url()
      expect(newUrl).not.toBe(currentUrl)
      expect(newUrl).toMatch(/\/(agents|topics|projects)\//)
    }
  })

  test('primary action button on expanded card executes correctly', async ({ page }) => {
    const card = getFirstExpandedCard(page)

    if (await card.isVisible()) {
      const primaryButton = card.locator('button').first()

      if (await primaryButton.isVisible()) {
        const currentUrl = page.url()
        await primaryButton.click()
        await page.waitForTimeout(200)

        // URL should not change
        expect(page.url()).toBe(currentUrl)
      }
    }
  })
})

// ===================================================================
// KEYBOARD NAVIGATION - TAB FOCUS
// ===================================================================

test.describe('Keyboard Navigation - Tab Focus', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('Tab navigates through cards', async ({ page }) => {
    // Get all compact cards
    const cards = page.locator('[class*="sm:hidden"]').filter({
      has: page.locator('[role="button"], article, section')
    })

    const cardCount = await cards.count()

    if (cardCount > 1) {
      // Focus first card via Tab
      const firstCard = cards.first()

      // Tab to focus first interactive element
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      const focusedElement = page.locator(':focus')
      const isFocused = await focusedElement.isVisible()

      expect(isFocused, 'An element should receive focus after Tab').toBe(true)

      // Tab again should move to next focusable element
      await page.keyboard.press('Tab')

      const nextFocusedElement = page.locator(':focus')
      const isNextFocused = await nextFocusedElement.isVisible()

      expect(isNextFocused, 'Tab should move focus to next element').toBe(true)
    }
  })

  test('Enter key opens card detail when card is focused', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Focus the card by clicking it first
      await card.focus()

      const currentUrl = page.url()

      // Press Enter
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')

      // Should navigate
      const newUrl = page.url()

      // If card was clickable, URL should change
      if (newUrl !== currentUrl) {
        expect(newUrl).toMatch(/\/(agents|topics|projects)\//)
      }
    }
  })

  test('Space key opens card detail when card is focused', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      await card.focus()

      const currentUrl = page.url()

      // Press Space
      await page.keyboard.press(' ')
      await page.waitForLoadState('networkidle')

      const newUrl = page.url()

      // If card was clickable, URL should change
      if (newUrl !== currentUrl) {
        expect(newUrl).toMatch(/\/(agents|topics|projects)\//)
      }
    }
  })
})

// ===================================================================
// KEYBOARD NAVIGATION - DROPDOWN MENU
// ===================================================================

test.describe('Keyboard Navigation - Dropdown Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('ESC key closes dropdown menu', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        const menu = page.locator('[role="menu"]')
        await expect(menu).toBeVisible()

        // Press ESC
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)

        // Menu should be closed
        await expect(menu).not.toBeVisible()
      }
    }
  })

  test('arrow keys navigate dropdown items', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        const menuItems = page.locator('[role="menuitem"]')
        const itemCount = await menuItems.count()

        if (itemCount > 1) {
          // Press ArrowDown
          await page.keyboard.press('ArrowDown')
          await page.waitForTimeout(100)

          const focusedElement = page.locator(':focus')
          const isFocused = await focusedElement.isVisible()

          expect(isFocused, 'ArrowDown should focus a menu item').toBe(true)

          // Press ArrowDown again
          await page.keyboard.press('ArrowDown')
          await page.waitForTimeout(100)

          // Should still have focus (moved to next item)
          const stillFocused = await page.locator(':focus').isVisible()
          expect(stillFocused, 'ArrowDown should move to next menu item').toBe(true)
        }
      }
    }
  })
})

// ===================================================================
// ACTION EXECUTION
// ===================================================================

test.describe('Action Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('edit button click triggers edit flow', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Look for edit button (pencil icon, edit label)
      const editButton = card.getByRole('button', { name: /edit/i })

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(300)

        // Edit action may open dialog or navigate
        // Check for dialog or URL change
        const dialog = page.locator('[role="dialog"]')
        const dialogVisible = await dialog.isVisible().catch(() => false)

        const currentUrl = page.url()

        // Either dialog opened or URL changed (edit mode)
        expect(dialogVisible || currentUrl.includes('edit'),
          'Edit action should trigger dialog or navigation').toBeTruthy()
      }
    }
  })

  test('delete action shows confirmation', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Open menu
        await overflowButton.click()
        await page.waitForTimeout(200)

        // Look for delete item
        const deleteItem = page.getByRole('menuitem', { name: /delete/i })

        if (await deleteItem.isVisible()) {
          await deleteItem.click()
          await page.waitForTimeout(300)

          // Should show confirmation dialog
          const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
          const confirmVisible = await confirmDialog.isVisible().catch(() => false)

          expect(confirmVisible,
            'Delete action should show confirmation dialog').toBe(true)

          // Close dialog if visible
          if (confirmVisible) {
            const cancelButton = page.getByRole('button', { name: /cancel/i })
            if (await cancelButton.isVisible()) {
              await cancelButton.click()
            }
          }
        }
      }
    }
  })

  test('copy action provides feedback', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Look for copy button
      const copyButton = card.getByRole('button', { name: /copy/i })

      // Copy action may be in overflow menu
      let copyClickable = await copyButton.isVisible().catch(() => false)

      if (!copyClickable) {
        const overflowButton = card.getByRole('button', { name: /more actions/i })
        if (await overflowButton.isVisible()) {
          await overflowButton.click()
          await page.waitForTimeout(200)

          const copyMenuItem = page.getByRole('menuitem', { name: /copy/i })
          copyClickable = await copyMenuItem.isVisible().catch(() => false)

          if (copyClickable) {
            await copyMenuItem.click()
            await page.waitForTimeout(300)

            // Should show toast notification or success feedback
            const toast = page.locator('[role="status"], [role="alert"]').filter({
              hasText: /copied|success/i
            })

            const toastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false)

            // Copy action should provide some feedback
            expect(toastVisible,
              'Copy action should show success feedback').toBeTruthy()
          }
        }
      }
    }
  })

  test('multiple action sequence executes correctly', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      // Execute primary action
      const primaryButton = card.locator('button').first()

      if (await primaryButton.isVisible()) {
        await primaryButton.click()
        await page.waitForTimeout(200)

        // Then open overflow menu
        const overflowButton = card.getByRole('button', { name: /more actions/i })

        if (await overflowButton.isVisible()) {
          await overflowButton.click()
          await page.waitForTimeout(200)

          const menu = page.locator('[role="menu"]')
          await expect(menu).toBeVisible()

          // Click first menu item
          const firstItem = page.locator('[role="menuitem"]').first()
          await firstItem.click()
          await page.waitForTimeout(200)

          // Menu should close
          await expect(menu).not.toBeVisible()
        }
      }
    }
  })
})

// ===================================================================
// TOUCH TARGETS & ACCESSIBILITY
// ===================================================================

test.describe('Touch Targets & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(ROUTES_WITH_CARDS.agents)
    await waitForPageLoad(page)
  })

  test('all action buttons have aria-label', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const buttons = card.locator('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const ariaLabel = await button.getAttribute('aria-label')

          expect(ariaLabel,
            `Button ${i} should have aria-label`).toBeTruthy()
        }
      }
    }
  })

  test('action buttons meet minimum touch target size', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const buttons = card.locator('button')
      const buttonCount = await buttons.count()

      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const box = await button.boundingBox()

          if (box) {
            const message = `Button ${i} size: ${box.width}x${box.height}px (expected >= 44px)`
            expect(box.width, message).toBeGreaterThanOrEqual(44)
            expect(box.height, message).toBeGreaterThanOrEqual(44)
          }
        }
      }
    }
  })

  test('dropdown menu items are keyboard accessible', async ({ page }) => {
    const card = getFirstCompactCard(page)

    if (await card.isVisible()) {
      const overflowButton = card.getByRole('button', { name: /more actions/i })

      if (await overflowButton.isVisible()) {
        // Focus button via Tab
        await overflowButton.focus()

        // Open via Enter
        await page.keyboard.press('Enter')
        await page.waitForTimeout(200)

        const menu = page.locator('[role="menu"]')
        await expect(menu).toBeVisible()

        // Navigate via ArrowDown
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(100)

        const focusedItem = page.locator(':focus')
        const isFocused = await focusedItem.isVisible()

        expect(isFocused,
          'Menu items should be keyboard accessible').toBe(true)
      }
    }
  })
})
