import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests for Key Components
 *
 * Tests individual components (badges, cards, buttons) in isolation
 * to catch visual regressions in design system.
 *
 * Run with: npm run test:visual
 * Update snapshots: npm run test:visual:update
 */

// Mock data for consistent component rendering
const MOCK_TOPICS = {
  items: [
    {
      id: '1',
      name: 'Performance',
      icon: 'Zap',
      color: '#F59E0B',
      atom_count: 12,
      updated_at: '2024-03-10T12:00:00Z'
    },
    {
      id: '2',
      name: 'Database',
      icon: 'Database',
      color: '#3B82F6',
      atom_count: 8,
      updated_at: '2024-03-09T16:45:00Z'
    },
    {
      id: '3',
      name: 'Security',
      icon: 'Shield',
      color: '#EF4444',
      atom_count: 5,
      updated_at: '2024-03-08T09:15:00Z'
    }
  ],
  total: 3
}

test.describe('Topic Cards Visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: MOCK_TOPICS })
    })
  })

  const themes = ['light', 'dark']

  for (const theme of themes) {
    test(`topic cards render correctly in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto('/topics')

      await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.classList.add('dark'))
      } else {
        await page.evaluate(() => document.documentElement.classList.remove('dark'))
      }

      await page.waitForLoadState('networkidle')
      const topicCard = page.locator('[data-testid*="topic-card"], article, [class*="card"]').first()
      await topicCard.waitFor({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(`topic-cards-${theme}.png`, {
        fullPage: true,
        animations: 'disabled'
      })
    })
  }
})

test.describe('Empty States Visual', () => {
  test('empty state visual in light mode', async ({ page }) => {
    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/topics')

    await page.emulateMedia({ colorScheme: 'light' })
    await page.evaluate(() => document.documentElement.classList.remove('dark'))

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('empty-state-light.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('empty state visual in dark mode', async ({ page }) => {
    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: { items: [], total: 0 } })
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/topics')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.evaluate(() => document.documentElement.classList.add('dark'))

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('empty-state-dark.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })
})

test.describe('Responsive Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/topics**', async route => {
      await route.fulfill({ json: MOCK_TOPICS })
    })
  })

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ]

  for (const viewport of viewports) {
    test(`components are responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/topics')

      await page.emulateMedia({ colorScheme: 'light' })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(`components-responsive-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled'
      })
    })
  }
})
