import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests for SearchBar Component
 *
 * Captures screenshots of the SearchBar in various states to ensure
 * visual consistency across changes.
 *
 * Run with: npx playwright test tests/e2e/visual/searchbar-visual.spec.ts
 * Update snapshots: npx playwright test tests/e2e/visual/searchbar-visual.spec.ts --update-snapshots
 */

// Mock data definitions to ensure deterministic snapshots
const MOCK_SEARCH_RESULTS = {
  topics: [
    {
      id: '1',
      name: 'Performance Optimization',
      description: 'Strategies for improving application performance',
      match_snippet: 'Strategies for improving <mark>application</mark> <mark>performance</mark>',
      rank: 1,
    },
    {
      id: '2',
      name: 'Database Migration',
      description: 'PostgreSQL migration guide',
      match_snippet: 'PostgreSQL <mark>migration</mark> guide and best practices',
      rank: 2,
    },
  ],
  atoms: [
    {
      id: '1',
      type: 'insight',
      title: 'Cache Invalidation Strategy',
      content_snippet: 'Using tagged <mark>cache</mark> keys improves invalidation ratio',
      user_approved: true,
      rank: 1,
    },
    {
      id: '2',
      type: 'decision',
      title: 'Switch to Redis',
      content_snippet: 'Decided to use <mark>Redis</mark> for session storage',
      user_approved: false,
      rank: 2,
    },
    {
      id: '3',
      type: 'problem',
      title: 'Memory Leak Issue',
      content_snippet: '<mark>Memory</mark> consumption grows over time',
      user_approved: true,
      rank: 3,
    },
  ],
  messages: [
    {
      id: '1',
      content_snippet: 'We should optimize the <mark>database</mark> queries for better performance',
      author: 'John Doe',
      timestamp: '2024-03-10T10:00:00Z',
      topic: { id: '1', name: 'Performance' },
      rank: 1,
    },
    {
      id: '2',
      content_snippet: 'The <mark>API</mark> response time has improved significantly',
      author: 'Jane Smith',
      timestamp: '2024-03-10T09:30:00Z',
      topic: { id: '2', name: 'Backend' },
      rank: 2,
    },
  ],
  total_results: 7,
  query: 'test query',
}

const MOCK_EMPTY_RESULTS = {
  topics: [],
  atoms: [],
  messages: [],
  total_results: 0,
  query: 'nonexistent query',
}

// Base API mocks required for Dashboard page to load
const setupBaseMocks = async (page: import('@playwright/test').Page) => {
  await page.route('**/api/v1/dashboard/metrics**', async (route) => {
    await route.fulfill({
      json: {
        atoms: { by_type: { insight: 5, problem: 2 } },
        trends: { atoms: { current: 7 } },
      },
    })
  })

  await page.route('**/api/v1/dashboard/trends**', async (route) => {
    await route.fulfill({ json: { items: [] } })
  })

  await page.route('**/api/v1/atoms**', async (route) => {
    await route.fulfill({ json: { items: [], total: 0 } })
  })

  await page.route('**/api/v1/topics**', async (route) => {
    await route.fulfill({ json: { items: [], total: 0 } })
  })
}

test.describe('SearchBar Visual Regression', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ]
  const themes = ['light', 'dark']

  test.beforeEach(async ({ page }) => {
    await setupBaseMocks(page)
  })

  // Empty state tests - searchbar with placeholder
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`searchbar empty state in ${theme} on ${viewport.name}`, async ({ page }) => {
        // Mock search endpoint with empty response
        await page.route('**/api/v1/search/**', async (route) => {
          await route.fulfill({ json: MOCK_EMPTY_RESULTS })
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'))
        }

        await page.waitForLoadState('networkidle')

        // Wait for searchbar to be visible
        const searchInput = page.locator('input#global-search')
        await searchInput.waitFor({ state: 'visible', timeout: 10000 })

        // Wait for any animations to finish
        await page.waitForTimeout(500)

        // Screenshot the search input container
        const searchContainer = searchInput.locator('..')
        await expect(searchContainer).toHaveScreenshot(
          `searchbar-empty-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }

  // Focused state tests
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`searchbar focused in ${theme} on ${viewport.name}`, async ({ page }) => {
        await page.route('**/api/v1/search/**', async (route) => {
          await route.fulfill({ json: MOCK_EMPTY_RESULTS })
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'))
        }

        await page.waitForLoadState('networkidle')

        const searchInput = page.locator('input#global-search')
        await searchInput.waitFor({ state: 'visible', timeout: 10000 })

        // Focus the input
        await searchInput.focus()
        await page.waitForTimeout(300)

        const searchContainer = searchInput.locator('..')
        await expect(searchContainer).toHaveScreenshot(
          `searchbar-focused-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }

  // With query text (no dropdown yet - query too short)
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`searchbar with query in ${theme} on ${viewport.name}`, async ({ page }) => {
        await page.route('**/api/v1/search/**', async (route) => {
          await route.fulfill({ json: MOCK_SEARCH_RESULTS })
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'))
        }

        await page.waitForLoadState('networkidle')

        const searchInput = page.locator('input#global-search')
        await searchInput.waitFor({ state: 'visible', timeout: 10000 })

        // Type a short query (1 char - dropdown won't open, MIN_QUERY_LENGTH = 2)
        await searchInput.fill('t')
        await page.waitForTimeout(300)

        const searchContainer = searchInput.locator('..')
        await expect(searchContainer).toHaveScreenshot(
          `searchbar-with-query-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }

  // With results dropdown
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`searchbar with results in ${theme} on ${viewport.name}`, async ({ page }) => {
        await page.route('**/api/v1/search/**', async (route) => {
          await route.fulfill({ json: MOCK_SEARCH_RESULTS })
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'))
        }

        await page.waitForLoadState('networkidle')

        const searchInput = page.locator('input#global-search')
        await searchInput.waitFor({ state: 'visible', timeout: 10000 })

        // Type query to trigger dropdown (MIN_QUERY_LENGTH = 2)
        await searchInput.fill('test query')
        await page.waitForTimeout(500)

        // Wait for dropdown to appear
        const dropdown = page.locator('[cmdk-list]')
        await dropdown.waitFor({ state: 'visible', timeout: 5000 })

        // Wait for loading to complete and results to render
        await page.waitForTimeout(300)

        // Screenshot the dropdown along with the search input
        // Use a container that includes both input and popover
        const popoverContent = page.locator('[data-radix-popper-content-wrapper]')
        await expect(popoverContent).toHaveScreenshot(
          `searchbar-with-results-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }

  // No results state
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`searchbar no results in ${theme} on ${viewport.name}`, async ({ page }) => {
        await page.route('**/api/v1/search/**', async (route) => {
          await route.fulfill({ json: MOCK_EMPTY_RESULTS })
        })

        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/dashboard')
        await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

        if (theme === 'dark') {
          await page.evaluate(() => document.documentElement.classList.add('dark'))
        } else {
          await page.evaluate(() => document.documentElement.classList.remove('dark'))
        }

        await page.waitForLoadState('networkidle')

        const searchInput = page.locator('input#global-search')
        await searchInput.waitFor({ state: 'visible', timeout: 10000 })

        // Type query that returns no results
        await searchInput.fill('nonexistent query')
        await page.waitForTimeout(500)

        // Wait for dropdown with empty state
        const dropdown = page.locator('[cmdk-list]')
        await dropdown.waitFor({ state: 'visible', timeout: 5000 })

        // Wait for empty state to render
        await page.waitForTimeout(300)

        const popoverContent = page.locator('[data-radix-popper-content-wrapper]')
        await expect(popoverContent).toHaveScreenshot(
          `searchbar-no-results-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }

  // Loading state (debouncing)
  for (const theme of themes) {
    test(`searchbar loading state in ${theme}`, async ({ page }) => {
      // Delay the API response to capture loading state
      await page.route('**/api/v1/search/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await route.fulfill({ json: MOCK_SEARCH_RESULTS })
      })

      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/dashboard')
      await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })

      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.classList.add('dark'))
      } else {
        await page.evaluate(() => document.documentElement.classList.remove('dark'))
      }

      await page.waitForLoadState('networkidle')

      const searchInput = page.locator('input#global-search')
      await searchInput.waitFor({ state: 'visible', timeout: 10000 })

      // Type query to trigger loading
      await searchInput.fill('test')

      // Wait briefly for loading state to appear (spinner icon)
      await page.waitForTimeout(200)

      // Screenshot the loading spinner in input
      const searchContainer = searchInput.locator('..')
      await expect(searchContainer).toHaveScreenshot(
        `searchbar-loading-input-${theme}.png`,
        { animations: 'disabled' }
      )

      // Wait for dropdown to appear with skeleton loading
      const dropdown = page.locator('[cmdk-list]')
      await dropdown.waitFor({ state: 'visible', timeout: 5000 })

      const popoverContent = page.locator('[data-radix-popper-content-wrapper]')
      await expect(popoverContent).toHaveScreenshot(
        `searchbar-loading-dropdown-${theme}.png`,
        { animations: 'disabled' }
      )
    })
  }

  // Clear button visibility
  test('searchbar clear button appears with text', async ({ page }) => {
    await page.route('**/api/v1/search/**', async (route) => {
      await route.fulfill({ json: MOCK_EMPTY_RESULTS })
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input#global-search')
    await searchInput.waitFor({ state: 'visible', timeout: 10000 })

    // Verify clear button is not visible when empty
    const clearButton = page.locator('button[aria-label="Clear search"]')
    await expect(clearButton).not.toBeVisible()

    // Type text
    await searchInput.fill('test')
    await page.waitForTimeout(200)

    // Verify clear button is now visible
    await expect(clearButton).toBeVisible()

    const searchContainer = searchInput.locator('..')
    await expect(searchContainer).toHaveScreenshot(
      'searchbar-with-clear-button.png',
      { animations: 'disabled' }
    )
  })

  // Keyboard shortcut indicator (/) in placeholder
  test('searchbar shows keyboard shortcut in placeholder', async ({ page }) => {
    await page.route('**/api/v1/search/**', async (route) => {
      await route.fulfill({ json: MOCK_EMPTY_RESULTS })
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input#global-search')
    await searchInput.waitFor({ state: 'visible', timeout: 10000 })

    // Verify placeholder contains keyboard shortcut hint
    const placeholder = await searchInput.getAttribute('placeholder')
    expect(placeholder).toContain('/')

    await page.waitForTimeout(300)

    const searchContainer = searchInput.locator('..')
    await expect(searchContainer).toHaveScreenshot(
      'searchbar-placeholder-with-shortcut.png',
      { animations: 'disabled' }
    )
  })
})
