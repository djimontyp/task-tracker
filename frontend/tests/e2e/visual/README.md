# Visual Regression Tests

Visual regression testing suite for Pulse Radar frontend components using Playwright.

## Overview

These tests capture screenshots of key UI components and pages to detect unintended visual changes. They run against mocked API data to ensure deterministic results.

## Test Files

| File | Coverage |
|------|----------|
| `dashboard-visual.spec.ts` | Dashboard page with metrics, trends, atoms |
| `navbar-visual.spec.ts` | Navbar, SearchBar states, responsive menu |
| `components-visual.spec.ts` | Badges, cards, buttons, empty states |
| `cards.spec.ts` | CompactCard/ExpandedCard: states, responsive, interactions (17 scenarios) |
| `searchbar-visual.spec.ts` | Search bar visual states |

## Coverage

**Themes:** Light + Dark mode
**Viewports:** Desktop (1280x800), Tablet (768x1024), Mobile (375x667)
**States:** Default, hover, loading, empty

## Running Tests

```bash
# Check visual regressions (fails if snapshots differ)
npm run test:visual

# Update snapshots (after intentional UI changes)
npm run test:visual:update

# Run specific test file
npx playwright test tests/e2e/visual/navbar-visual.spec.ts

# Debug with UI mode
npx playwright test tests/e2e/visual/ --ui
```

## Workflow

### 1. Making UI Changes

When you change UI code (styles, components, layout):

```bash
# 1. Make your changes to src/
# 2. Run visual tests to see what broke
npm run test:visual

# 3. Review diff images in playwright-report/
# 4. If changes are intentional, update snapshots
npm run test:visual:update

# 5. Commit new snapshots with your changes
git add tests/e2e/visual/**/*.png
git commit -m "feat: update button styles + visual snapshots"
```

### 2. CI/CD Integration

Visual tests run automatically in CI. If they fail:

1. Check Playwright report artifacts
2. Download diff images
3. Verify if changes are intentional or bugs
4. If intentional: update snapshots locally and push
5. If bugs: fix UI code and re-run

## Snapshot Organization

```
tests/e2e/visual/
├── README.md (this file)
├── dashboard-visual.spec.ts
├── navbar-visual.spec.ts
├── components-visual.spec.ts
└── {test-name}.spec.ts-snapshots/
    ├── dashboard-dark-desktop.png
    ├── dashboard-light-mobile.png
    ├── navbar-dark-tablet.png
    ├── searchbar-loading-light.png
    └── ...
```

Playwright stores snapshots in `{test-file}.spec.ts-snapshots/` directories.

## Best Practices

### ✅ DO

- Mock API data for deterministic results
- Wait for `networkidle` before screenshots
- Use `animations: 'disabled'` option
- Test both light and dark themes
- Test responsive breakpoints
- Name snapshots descriptively (`component-state-theme.png`)
- Update snapshots when UI changes are intentional

### ❌ DON'T

- Take screenshots of dynamic content (timestamps, random IDs)
- Use `waitForTimeout` without good reason
- Forget to test dark mode
- Skip mobile viewports
- Update snapshots without reviewing diffs
- Commit snapshots from different OS (use CI snapshots)

## Debugging Failed Tests

```bash
# 1. Run with --ui to see visual diff
npx playwright test tests/e2e/visual/ --ui

# 2. Run specific test with debug mode
npx playwright test navbar-visual.spec.ts --debug

# 3. Generate HTML report with diffs
npx playwright test tests/e2e/visual/
npx playwright show-report
```

## Configuration

Visual tests use Playwright config from `playwright.config.ts`:

- **Browsers:** Chromium, Firefox, WebKit
- **Screenshot timeout:** 30s
- **Expect timeout:** 5s
- **Max diff pixel ratio:** 0.2% (configurable)

## Adding New Visual Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('New Component Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API data
    await page.route('**/api/v1/endpoint**', async route => {
      await route.fulfill({ json: MOCK_DATA })
    })
  })

  const themes = ['light', 'dark']

  for (const theme of themes) {
    test(`component in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/page')

      // Set theme
      await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.classList.add('dark'))
      }

      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500) // Stabilize

      await expect(page).toHaveScreenshot(`component-${theme}.png`, {
        animations: 'disabled',
        fullPage: true // or use clip: { x, y, width, height }
      })
    })
  }
})
```

## Troubleshooting

### Snapshots differ on different machines

**Cause:** Different OS/browser render fonts/pixels differently
**Solution:** Generate snapshots in CI, commit those

### Flaky tests due to animations

**Cause:** CSS animations not fully disabled
**Solution:** Add `await page.waitForTimeout(500)` after `networkidle`

### Loading states not captured

**Cause:** API mocks resolve too fast
**Solution:** Add delay in route handler:
```typescript
await page.route('**/api/**', async route => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  await route.fulfill({ json: data })
})
```

### Dark mode not applying

**Cause:** Theme class not set on `<html>`
**Solution:** Ensure you run:
```typescript
await page.emulateMedia({ colorScheme: 'dark' })
await page.evaluate(() => document.documentElement.classList.add('dark'))
```

## Resources

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
