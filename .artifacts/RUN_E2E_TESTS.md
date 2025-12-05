# How to Run E2E Tests

## Prerequisites

1. **Start services** (потрібно для E2E тестів):
```bash
just services-dev
```

Або окремо тільки frontend + backend + postgres:
```bash
docker compose up -d postgres api dashboard nginx
```

2. **Перевірити що працює:**
```bash
curl http://localhost/api/v1/health
# → {"status":"ok",...}
```

## Run Tests

### Full accessibility suite (30 tests)
```bash
cd frontend && npx playwright test accessibility.spec.ts --project=chromium
```

### Only new tests (Phase 5)
```bash
# Design System Tokens (3 tests)
cd frontend && npx playwright test accessibility.spec.ts -g "Design System Tokens"

# Touch Targets Enhancement (3 tests)
cd frontend && npx playwright test accessibility.spec.ts -g "Touch Targets Enhancement"

# Status Indicators Accessibility (3 tests)
cd frontend && npx playwright test accessibility.spec.ts -g "Status Indicators Accessibility"
```

### All new tests at once
```bash
cd frontend && npx playwright test accessibility.spec.ts -g "F032"
```

### Debug mode (UI)
```bash
cd frontend && npx playwright test accessibility.spec.ts --ui
```

## Expected Results

### ✅ Should PASS:
- Design System Tokens:
  - ✅ Semantic color tokens defined
  - ✅ Shadow tokens different for card/dialog
  - ⚠️ Hardcoded classes ≤ 5 (if migration not complete)

- Touch Targets Enhancement:
  - ✅ Sidebar menu items ≥ 44px height
  - ✅ Navbar buttons ≥ 44px width/height
  - ✅ Card spacing ≥ 8px

- Status Indicators:
  - ✅ Validation badges have icon OR text
  - ✅ Atom type indicators have icons
  - ✅ Priority badges have aria-label or text

### ⚠️ Might FAIL (needs fixing):
- Hardcoded Tailwind classes > 5 occurrences
- Touch targets < 44px on mobile
- Status badges without icons/aria-labels

## Report

After running, check:
```bash
# Test report
cat frontend/playwright-report/index.html

# Screenshots (failures only)
ls frontend/test-results/accessibility-*/
```

## Troubleshooting

**ERR_CONNECTION_REFUSED:**
```bash
# Services not running
just services-dev
```

**Tests timeout:**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

**Visual debugging:**
```bash
# Run with headed browser
npx playwright test accessibility.spec.ts --project=chromium --headed
```
