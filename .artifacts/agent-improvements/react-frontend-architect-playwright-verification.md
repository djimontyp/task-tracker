# React Frontend Architect - Playwright Verification Improvement

**Date:** 2025-10-28
**Issue:** Agent didn't use MCP Playwright for verification despite it being available
**Priority:** Medium

## Current Behavior

react-frontend-architect агент після внесення змін:
- ✅ Перевіряє TypeScript компіляцію (`npm run typecheck`)
- ✅ Перевіряє dev server logs
- ❌ **НЕ** використовує MCP Playwright для E2E верифікації

## Example Case

**Task:** Fix `lucide-react` import error in `ScoringAccuracyCard.tsx`

**What agent did:**
```bash
npm run typecheck  # ✅ TypeScript check
docker compose logs dashboard  # ✅ Dev server check
curl http://localhost:3000  # ✅ HTTP check
```

**What agent should have done:**
```bash
npm run typecheck  # ✅ TypeScript check
docker compose logs dashboard  # ✅ Dev server check

# ✨ NEW: MCP Playwright verification
mcp__playwright__browser_navigate(url="http://localhost:3000")
mcp__playwright__browser_snapshot()  # Verify component renders
mcp__playwright__browser_click(element="Monitoring card", ref="...")  # Verify interactions
```

## Proposed Improvement

### Agent Instructions Update

Add to react-frontend-architect prompt:

```markdown
### Step 5: Verification (MANDATORY)

After making changes, ALWAYS verify through multiple layers:

1. **Static Analysis:**
   ```bash
   npm run typecheck
   npm run lint
   ```

2. **Runtime Verification:**
   ```bash
   # Check dev server logs
   docker compose logs dashboard --tail 50
   ```

3. **E2E Verification (if MCP Playwright available):**
   - Check if `mcp__playwright__*` tools are available
   - If yes, perform browser-based verification:
     ```
     a. Navigate to component URL
     b. Take snapshot to verify rendering
     c. Test key interactions (clicks, inputs)
     d. Verify no console errors
     ```
   - Document what was tested

4. **Manual Test Instructions:**
   - If Playwright not available, provide clear manual test steps
```

### Detection Logic

Agent should check MCP availability:

```python
# Pseudo-code for agent logic
playwright_available = "mcp__playwright__browser_navigate" in available_tools

if playwright_available:
    # Use Playwright for verification
    verify_via_playwright()
else:
    # Provide manual test instructions
    provide_manual_test_steps()
```

## Benefits

1. **Earlier Bug Detection:** Catch rendering issues before manual testing
2. **Confidence:** Agent can confirm fix works end-to-end
3. **Documentation:** Playwright snapshot serves as proof of fix
4. **Consistency:** Same verification approach every time

## Implementation Checklist

- [ ] Update react-frontend-architect system prompt
- [ ] Add Playwright verification examples
- [ ] Test with component change (like icon replacement)
- [ ] Document Playwright verification patterns
- [ ] Add to agent testing checklist

## Example Playwright Verification Workflow

### For Icon Replacement Fix (like lucide-react → heroicons)

```typescript
// 1. Navigate to component
await mcp__playwright__browser_navigate({
  url: "http://localhost:3000/dashboard/monitoring"
})

// 2. Wait for component to load
await mcp__playwright__browser_wait_for({
  text: "Scoring Accuracy"
})

// 3. Take snapshot to verify icons render
await mcp__playwright__browser_snapshot()

// Expected: Component renders with correct Heroicons
// - ExclamationCircleIcon visible
// - CheckCircleIcon visible
// - ArrowTrendingUpIcon visible

// 4. Check console for errors
const console_logs = await mcp__playwright__browser_console_messages({
  onlyErrors: true
})

// Expected: No import errors, no rendering errors

// 5. Test icon interactivity (if applicable)
await mcp__playwright__browser_hover({
  element: "Trend icon",
  ref: "[data-testid='trend-icon']"
})

// Verify tooltip or hover effect works
```

## Related Issues

- E2E testing strategy (NEXT_SESSION_TODO.md - Playwright tests 6-8h)
- Agent verification standards
- MCP integration best practices

## Notes

- Playwright MCP was enabled during session: `mcp server 'playwright' has been enabled`
- Agent should auto-detect MCP availability
- Fallback to manual instructions if Playwright unavailable
- Don't over-test: focus on critical paths affected by change
