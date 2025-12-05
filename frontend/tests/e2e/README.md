# E2E Tests with Playwright

## Overview

This directory contains End-to-End (E2E) tests for the Task Tracker frontend using [Playwright](https://playwright.dev/).

## Test Coverage

### 1. Topics Page (F004) (`topics.spec.ts`) ✅ NEW
Tests the Topics management page functionality:
- Page loading and header display
- Grid and list view modes with toggle
- Search with debounce (300ms)
- Sort by 5 options (created, name, updated dates)
- Navigation to topic detail page
- Icon and color display
- Pagination controls
- Empty state messaging
- Topic metadata display (ID, created date)
- Mobile responsive layout (375x667)
- LocalStorage persistence for view mode preference

**12 test cases** covering all Topics page features.

### 2. Settings Page (F030) (`settings.spec.ts`) ✅ NEW
Tests the Settings page with tab-based configuration:
- Page loading and header display
- Tab navigation (General, Sources, Providers)
- General tab content (theme selector)
- Sources tab with Telegram config cards
- Providers tab with LLM provider management
- Form inputs and controls
- Provider validation status indicators
- Keyboard navigation (Arrow keys)
- Lazy loading of tab content
- Mobile responsive layout
- Tab state persistence during navigation
- Form state preservation when switching tabs

**17 test cases** covering all Settings page features.

### 3. Telegram to Topic Knowledge Extraction (`telegram-to-topic.spec.ts`)
Tests the complete flow from Telegram message ingestion to topic creation with knowledge atoms:
- Message webhook simulation
- Background task monitoring (importance scoring, knowledge extraction)
- Real-time WebSocket updates
- Noise classification
- Topic and atom creation

### 4. Analysis Run Lifecycle (`analysis-run.spec.ts`)
Tests the analysis run creation, monitoring, and proposal review workflow:
- Analysis run creation with time window
- Real-time progress monitoring via WebSocket
- Status transitions (pending → running → completed)
- Task proposal review and batch actions
- Error handling

### 5. Accessibility Testing (`a11y/` directory) ✅ NEW

Comprehensive WCAG 2.1 AA compliance tests using axe-core + Playwright:

**Directory Structure:**
```
tests/e2e/
├── a11y/
│   ├── dashboard.a11y.spec.ts    # Dashboard page tests
│   ├── messages.a11y.spec.ts     # Messages page tests
│   ├── topics.a11y.spec.ts       # Topics page tests
│   └── settings.a11y.spec.ts     # Settings page tests
├── helpers/
│   └── checkA11y.ts              # Reusable a11y helper functions
└── accessibility.spec.ts          # Legacy comprehensive tests
```

**Test Coverage per page:**
- axe-core automated WCAG 2.1 AA scan
- Touch targets (44px minimum) - WCAG 2.5.5
- Focus indicators (3px outline) - WCAG 2.4.7
- Color not alone for status - WCAG 1.4.1
- Keyboard navigation
- Dark mode accessibility
- Mobile viewport accessibility

**Helper Functions (`helpers/checkA11y.ts`):**
- `checkA11y(page, options)` - Main axe-core scan with configurable severity
- `checkA11yCritical(page)` - Quick scan for critical issues only
- `checkA11yStrict(page)` - Full scan failing on any violation
- `checkTouchTargets(page, selector, minSize)` - Touch target verification
- `checkFocusVisibility(page, selector)` - Focus indicator verification
- `checkColorNotAlone(page, selector)` - Color-only indicator check

## Locale Support

All tests are designed to support both Ukrainian (uk) and English (en) locales.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run accessibility tests only
```bash
# Fast: Chromium only
npm run test:a11y

# All browsers
npm run test:a11y:all

# With HTML report
npm run test:a11y:report
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test tests/e2e/telegram-to-topic.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Debug tests
```bash
npx playwright test --debug
```

## Configuration

Playwright configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost`
- **Test Directory**: `tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web Server**: Auto-starts dev server on `http://localhost:3000`
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: Only on failure
- **Trace**: On first retry

## Test Implementation Status

### ✅ Recently Completed (Nov 30, 2025)

**Topics Page E2E Tests (F004):**
- ✅ 12 comprehensive test cases
- ✅ Grid/list view switching
- ✅ Search, sort, pagination
- ✅ Navigation and interaction
- ✅ Mobile responsive testing
- ✅ LocalStorage persistence

**Settings Page E2E Tests (F030):**
- ✅ 17 comprehensive test cases
- ✅ Tab navigation (General, Sources, Providers)
- ✅ Content loading and persistence
- ✅ Form interaction and state
- ✅ Keyboard navigation
- ✅ Mobile responsive testing

### ⏳ Remaining Tests (Stub Implementations)

Other test files still contain **stub implementations**:
- Telegram to Topic Knowledge Extraction
- Analysis Run Lifecycle
- Accessibility Compliance

## Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="create-analysis-run">Create Run</button>
   ```

2. **Wait for WebSocket events**:
   ```typescript
   await page.waitForSelector('[data-testid="task-status"][data-status="completed"]')
   ```

3. **Use page object model** for complex pages:
   ```typescript
   const messagesPage = new MessagesPage(page)
   await messagesPage.filterByStatus('signal')
   ```

4. **Test both success and error paths**:
   ```typescript
   test('should handle network errors gracefully', async ({ page }) => {
     await page.route('**/api/v1/topics', route => route.abort())
     // Verify error state UI
   })
   ```

5. **Use accessibility snapshots**:
   ```typescript
   await expect(page).toHaveScreenshot()
   ```

## CI/CD Integration

Tests are configured to run in CI with:
- Single worker (sequential execution)
- 2 retry attempts
- HTML reporter for debugging
- Only on Chromium browser (fastest)

### Accessibility CI Workflow

GitHub Actions workflow at `.github/workflows/accessibility.yml`:
- Runs on pull requests to `main` branch
- Tests only frontend changes
- Uses Chromium for faster execution
- Uploads test results as artifacts

**Trigger conditions:**
- Push to `main` branch (frontend changes)
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs:**
1. `accessibility` - WCAG 2.1 AA compliance tests via Playwright
2. `storybook-a11y` - Storybook build with addon-a11y verification

## Storybook Accessibility

The project uses `@storybook/addon-a11y` for visual accessibility testing in Storybook.

**Run Storybook:**
```bash
npm run storybook
```

**Features:**
- Accessibility tab in Storybook showing axe-core violations
- Per-story accessibility status
- WCAG 2.0/2.1 Level A/AA rule checks
- Color blindness simulation

**Configuration:** `.storybook/main.ts` includes `@storybook/addon-a11y` addon.

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Storybook Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [WebSocket Testing](https://playwright.dev/docs/network)
