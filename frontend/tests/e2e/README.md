# E2E Tests with Playwright

## Overview

This directory contains End-to-End (E2E) tests for the Task Tracker frontend using [Playwright](https://playwright.dev/).

## Test Coverage

### 1. Telegram to Topic Knowledge Extraction (`telegram-to-topic.spec.ts`)
Tests the complete flow from Telegram message ingestion to topic creation with knowledge atoms:
- Message webhook simulation
- Background task monitoring (importance scoring, knowledge extraction)
- Real-time WebSocket updates
- Noise classification
- Topic and atom creation

### 2. Analysis Run Lifecycle (`analysis-run.spec.ts`)
Tests the analysis run creation, monitoring, and proposal review workflow:
- Analysis run creation with time window
- Real-time progress monitoring via WebSocket
- Status transitions (pending → running → completed)
- Task proposal review and batch actions
- Error handling

### 3. Accessibility Compliance (`accessibility.spec.ts`)
Tests WCAG AA compliance and assistive technology support:
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels and roles
- Focus management
- Color contrast
- Screen reader compatibility

## Locale Support

All tests are designed to support both Ukrainian (uk) and English (en) locales.

## Running Tests

### Run all tests
```bash
npm run test:e2e
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

### ⏳ Current Status: Stub Tests (Not Implemented)

All test files contain **stub implementations** with:
- ✅ User stories and flow documentation
- ✅ Test structure with descriptive names
- ✅ Locale support placeholders
- ❌ Actual test implementation (marked with `test.skip`)

### 🎯 Next Session Goals

1. **Implement Telegram to Topic test**:
   - API integration for webhook simulation
   - WebSocket event listening
   - Message table verification
   - Topic detail page verification

2. **Implement Analysis Run test**:
   - Analysis run creation flow
   - Real-time progress monitoring
   - Proposal review workflow

3. **Implement Accessibility test**:
   - Keyboard navigation verification
   - ARIA label checks
   - Focus management tests

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

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WebSocket Testing](https://playwright.dev/docs/network)
