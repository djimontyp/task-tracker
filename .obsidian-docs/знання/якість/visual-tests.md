---
title: "Visual Regression Tests"
created: 2025-12-27
updated: 2025-12-27
tags:
  - тестування
  - playwright
  - visual-regression
status: active
---

# Visual Regression Tests

Порівняння скріншотів для виявлення візуальних регресій.

## Команди

```bash
# Запустити visual тести
npm run test:visual

# Оновити baseline snapshots
npm run test:visual:update

# Тільки chromium (швидше)
npx playwright test tests/e2e/visual/ --project=chromium
```

## Структура тестів

```
frontend/tests/e2e/visual/
├── dashboard-visual.spec.ts   # Dashboard (6 variants)
├── navbar-visual.spec.ts      # Navbar (6 variants)
└── components-visual.spec.ts  # Components
```

## Покриття

### Dashboard

| Viewport | Themes | Total |
|----------|--------|-------|
| desktop (1280×800) | light, dark | 2 |
| tablet (768×1024) | light, dark | 2 |
| mobile (375×667) | light, dark | 2 |

**+ Empty state variant**

### Navbar

| Viewport | Themes | Total |
|----------|--------|-------|
| desktop | light, dark | 2 |
| tablet | light, dark | 2 |
| mobile | light, dark | 2 |

## Паттерн тесту

```typescript
import { test, expect } from '@playwright/test'

test.describe('Component Visual Regression', () => {
  const themes = ['light', 'dark']
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 667 }
  ]

  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`component ${theme} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/page')

        // Set theme
        await page.emulateMedia({
          colorScheme: theme === 'dark' ? 'dark' : 'light'
        })
        if (theme === 'dark') {
          await page.evaluate(() =>
            document.documentElement.classList.add('dark')
          )
        }

        await page.waitForLoadState('networkidle')

        // Screenshot
        await expect(page).toHaveScreenshot(
          `component-${theme}-${viewport.name}.png`,
          { animations: 'disabled' }
        )
      })
    }
  }
})
```

## Mock API

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/metrics**', async route => {
    await route.fulfill({ json: MOCK_DATA })
  })
})
```

## Snapshots

Зберігаються в:
```
tests/e2e/visual/*.spec.ts-snapshots/
├── dashboard-light-desktop-chromium-darwin.png
├── dashboard-dark-desktop-chromium-darwin.png
└── ...
```

## Пов'язане

- [[playwright]]
- [[storybook]]
- [[wcag]]
