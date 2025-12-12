# Storybook Coverage Audit

Audit Storybook coverage for shared components.

## Task

Run story coverage check and provide a detailed report:

```bash
cd frontend && npm run story:check:fix
```

## Report Format

After running the check, provide:

### Summary Table

| Category | Total | With Story | Missing | Coverage |
|----------|-------|------------|---------|----------|
| shared/ui | X | Y | Z | %% |
| shared/patterns | X | Y | Z | %% |
| shared/components | X | Y | Z | %% |

### Missing Stories (if any)

For each missing story, show:
1. Component path
2. Expected story path
3. Tier (1/2/3) and minimum stories required
4. Suggested template to use

### Recommendations

- Prioritize Tier 1 (shared/ui) first
- Use templates from `.claude/skills/storybook/templates/`
- Run `just storybook` to verify stories work

## Example Output

```
📊 Storybook Coverage Report

| Category | Total | Stories | Coverage |
|----------|-------|---------|----------|
| shared/ui | 33 | 31 | 94% |
| shared/patterns | 5 | 5 | 100% |
| shared/components | 17 | 12 | 71% |

❌ Missing stories (7):
1. shared/ui/spinner.tsx → Tier 1, use shared-ui.template
2. shared/ui/progress.tsx → Tier 1, use shared-ui.template
3. shared/components/MetricCard.tsx → Tier 2, use pattern.template
...

💡 Recommendations:
- Create stories for spinner.tsx and progress.tsx first (Tier 1)
- Use `npm run story:check` after fixes to verify
```
