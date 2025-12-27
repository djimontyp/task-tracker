import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests for Navbar & SearchBar
 *
 * Captures screenshots of the navbar in various states and viewports
 * to ensure visual consistency across changes.
 *
 * Run with: npm run test:visual
 * Update snapshots: npm run test:visual:update
 */

test.describe('Navbar Visual Regression', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ]
  const themes = ['light', 'dark']

  test.beforeEach(async ({ page }) => {
    // Mock all API endpoints needed for Dashboard page
    await page.route('**/api/v1/dashboard/metrics**', async route => {
      await route.fulfill({
        json: {
          atoms: { by_type: { insight: 5, problem: 2 } },
          trends: { atoms: { current: 7 } }
        }
      })
    })

    await page.route('**/api/v1/dashboard/trends**', async route => {
      await route.fulfill({ json: { items: [] } })
    })

    await page.route('**/api/v1/atoms**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.route('**/api/v1/search/**', async route => {
      await route.fulfill({ json: { messages: [], atoms: [], topics: [], total: 0 } })
    })
  })

  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`navbar ${theme} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })
        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        }
        await page.waitForLoadState('networkidle')

        // Screenshot just the navbar (uses <nav> tag, not <header>)
        const navbar = page.locator('nav[aria-label="Main navigation"]').first()
        await navbar.waitFor({ state: 'visible', timeout: 10000 })
        await expect(navbar).toHaveScreenshot(`navbar-${theme}-${viewport.name}.png`)
      })
    }
  }

  // Note: SearchBar is rendered as a separate component (SearchContainer)
  // passed as a prop to Navbar. Visual testing for SearchBar should be done
  // in a separate test file: searchbar-visual.spec.ts
})

test.describe('SearchBar Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints
    await page.route('**/api/v1/dashboard/metrics**', async route => {
      await route.fulfill({
        json: {
          atoms: { by_type: { insight: 5, problem: 2 } },
          trends: { atoms: { current: 7 } }
        }
      })
    })
    await page.route('**/api/v1/dashboard/trends**', async route => {
      await route.fulfill({ json: { items: [] } })
    })
    await page.route('**/api/v1/atoms**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })
    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })
    await page.route('**/api/v1/search/**', async route => {
      await route.fulfill({ json: { messages: [], atoms: [], topics: [], total: 0 } })
    })
  })

  test.skip('searchbar empty state', async ({ page }) => {
    // TODO: Implement searchbar visual tests
    // SearchBar is rendered via SearchContainer component
    // Need to find correct selector or create dedicated searchbar test page
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const searchbar = page.getByRole('searchbox').first()
    await searchbar.waitFor({ state: 'visible', timeout: 10000 })
    await expect(searchbar).toHaveScreenshot('searchbar-empty.png')
  })

  test.skip('searchbar with query', async ({ page }) => {
    // TODO: Implement searchbar visual tests
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const searchbar = page.getByRole('searchbox').first()
    await searchbar.waitFor({ state: 'visible', timeout: 10000 })
    await searchbar.fill('test query')
    await page.waitForTimeout(500)
    await expect(searchbar).toHaveScreenshot('searchbar-with-query.png')
  })
})
