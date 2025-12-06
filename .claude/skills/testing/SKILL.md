---
name: testing
description: pytest, Vitest, Playwright testing patterns for Pulse Radar.
---

# Testing Skill

## Test Coverage
| Layer | Count | Tools |
|-------|-------|-------|
| Backend | 521 tests | pytest, pytest-asyncio |
| Frontend | 51 tests | Vitest, Testing Library |
| E2E | 13 specs | Playwright |
| Visual | 65 stories | Storybook |

## Backend Test Pattern
```python
@pytest.mark.asyncio
async def test_atom_service_create(db_session: AsyncSession):
    service = AtomService(AtomCRUD(db_session))
    atom = await service.create(AtomCreate(content="test", atom_type=AtomType.INSIGHT))

    assert atom.id is not None, f"Atom ID missing"
    assert atom.status == AtomStatus.DRAFT, f"Expected DRAFT, got {atom.status}"
```

## Frontend Test Pattern
```typescript
describe('BulkActionsToolbar', () => {
  it('should call onSelectAll when clicked', () => {
    const onSelectAll = vi.fn();
    render(<BulkActionsToolbar onSelectAll={onSelectAll} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });
});
```

## E2E Test Pattern
```typescript
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });
});
```

## Critical Rules
1. **Assertion messages required**
   ```python
   assert x == y, f"Expected {y}, got {x}: {context}"
   ```

2. **Never sabotage tests** — no skip, no comment out, no always-green

3. **Test must fail on breakage** — if UI breaks and test passes, test is bad

## References
- @references/pytest.md — Fixtures, factories, async patterns
- @references/vitest.md — Component testing, hook testing
- @references/playwright.md — E2E flows, accessibility testing