---
description: Frontend audit - flexible, do what user asks. Design system, a11y, architecture, tests, portability, shadcn health.
argument-hint: [what to check or fix - free text]
---

# Frontend Audit

**Task:** $ARGUMENTS

**Context:**
- Project: Pulse Radar (React 18 + TypeScript + Tailwind + shadcn/ui)
- Frontend path: `frontend/`
- Design System: 9 ESLint rules, semantic tokens, 4px grid, 44px touch targets

## Available Tools

**CLI checks:**
- `cd frontend && npm run lint` - ESLint (9 Design System rules)
- `cd frontend && npx tsc --noEmit` - TypeScript
- `cd frontend && npm run test:run` - Vitest
- `cd frontend && npm run story:check` - Storybook coverage
- `cd frontend && npm run test:a11y` - Accessibility tests

**Grep patterns:**
- Raw colors: `bg-red-`, `text-green-`, `border-blue-`
- Off-grid spacing: `gap-3`, `p-5`, `m-7`
- Wrong icons: `@heroicons`
- Missing aria: `size="icon"` without `aria-label`

**MCP tools:**
- `mcp__storybook__*` - component screenshots, props inspection
- `mcp__playwright__*` - browser testing, a11y snapshots

**Parallel agents (Task tool):**
- Visual Designer (V1) - design tokens, colors, spacing
- UX Specialist (U1) - accessibility, WCAG, touch targets
- Frontend Expert (F1) - React patterns, architecture
- Super QA (Q1) - test coverage, edge cases

## Rules Reference

| Rule | Correct | Wrong |
|------|---------|-------|
| Colors | `bg-semantic-success` | `bg-green-500` |
| Spacing | `gap-2`, `gap-4`, `p-4` | `gap-3`, `p-5` |
| Icons | `lucide-react` | `@heroicons/react` |
| Touch | `h-11 w-11` (44px) | `h-9 w-9` |
| Status | Icon + Text | Color only |
| Icon btn | `aria-label="..."` | No label |

## Component Portability Check (NEW!)

**Principle:** Components in `shared/` must be portable - no API calls, no store, no router.

**Violations to detect:**
```bash
# API calls in shared components
grep -rE "useQuery|useMutation|apiClient|fetch\(" \
  src/shared/components src/shared/patterns \
  --include="*.tsx" | grep -v ".test.tsx\|.stories.tsx"

# Store imports in shared
grep -r "useUIStore\|useMessagesStore" \
  src/shared/components src/shared/patterns \
  --include="*.tsx"

# Router dependencies in shared
grep -r "useNavigate\|useParams\|useLocation" \
  src/shared/components src/shared/patterns \
  --include="*.tsx"
```

**Portability Score:**
```bash
VIOLATIONS=$(grep -rE "useQuery|apiClient" src/shared/components --include="*.tsx" 2>/dev/null | grep -v test | wc -l | tr -d ' ')
if [ "$VIOLATIONS" = "0" ]; then
  echo "✅ Portability: 100% (all shared components portable)"
else
  echo "⚠️ Portability: $VIOLATIONS violations found"
fi
```

**Known violations to fix:**
- `shared/components/ActivityHeatmap/` - useQuery + apiClient
- `shared/components/AppSidebar/` - useQuery + useLocation

## shadcn/ui Health Check (NEW!)

**Component usage analysis:**
```bash
# Count imports per shadcn component
grep -rh "from '@/shared/ui/" src --include="*.tsx" | \
  grep -oE "@/shared/ui/[a-z-]+" | sort | uniq -c | sort -rn

# Find unused shadcn components (0 imports)
for comp in button card badge skeleton tooltip input select label dialog tabs; do
  count=$(grep -r "@/shared/ui/$comp" src/features src/pages --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  [ "$count" = "0" ] && echo "❌ Unused: $comp"
done
```

**Metrics:**
| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Unused components | 0 | 1-3 | >3 |
| Low-usage (<3 imports) | <5 | 5-10 | >10 |
| Stories coverage | >90% | 70-90% | <70% |

**Known unused (to delete):**
- `breadcrumb.tsx` + stories (0 imports)

## Full Audit Checklist

When running full audit (`/audit` without args), check ALL:

### 1. CLI Checks (parallel)
```bash
cd frontend
npm run lint &
npx tsc --noEmit &
npm run test:run &
npm run story:check &
wait
```

### 2. Design System
- [ ] ESLint 9 rules pass
- [ ] No raw Tailwind colors
- [ ] 4px grid spacing only
- [ ] Touch targets ≥44px
- [ ] Icon buttons have aria-label
- [ ] Status = icon + text

### 3. Architecture
- [ ] Feature-based structure
- [ ] No circular dependencies
- [ ] API layer consistency (axios vs fetch)
- [ ] Zustand + TanStack Query separation

### 4. Component Portability
- [ ] shared/components - no useQuery
- [ ] shared/components - no apiClient
- [ ] shared/components - no useNavigate
- [ ] shared/patterns - pure presenters
- [ ] All data via props

### 5. shadcn/ui Health
- [ ] No unused components
- [ ] Low-usage components reviewed
- [ ] Stories coverage >90%

### 6. Accessibility (WCAG AA)
- [ ] Touch targets ≥44px
- [ ] Focus indicators visible
- [ ] Reduced motion support
- [ ] Semantic HTML

### 7. Test Coverage
- [ ] Unit tests for shared/
- [ ] E2E for critical flows
- [ ] Stories for all shared/

## Execution

Based on "$ARGUMENTS":

1. **Interpret** what user wants (check, fix, report, specific area)
2. **Choose** appropriate tools (CLI, grep, agents, MCP)
3. **Parallelize** where possible (multiple agents, multiple bash commands)
4. **Report** findings with severity: Critical / High / Medium / Low
5. **Ask** before making fixes (unless user said to auto-fix)

If no arguments - run full audit with all checks.

## Output Format

```markdown
# Frontend Audit Report

## Summary
| Area | Status | Issues |
|------|--------|--------|
| TypeScript | ✅ Pass | 0 |
| ESLint | ⚠️ Warnings | 22 |
| Tests | ✅ Pass | 159 tests |
| Storybook | ⚠️ Gap | 1 missing |
| Portability | ❌ Violations | 2 components |
| shadcn Health | ⚠️ Review | 1 unused |

## Critical Issues
1. ...

## High Priority
1. ...

## Recommendations
1. ...
```
