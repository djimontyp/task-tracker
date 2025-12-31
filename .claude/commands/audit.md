---
description: Frontend audit - flexible, do what user asks. Design system, a11y, architecture, tests, visual checks.
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

## Execution

Based on "$ARGUMENTS":

1. **Interpret** what user wants (check, fix, report, specific area)
2. **Choose** appropriate tools (CLI, grep, agents, MCP)
3. **Parallelize** where possible (multiple agents, multiple bash commands)
4. **Report** findings in clear format
5. **Ask** before making fixes (unless user said to auto-fix)

If no arguments - run full audit with all checks.