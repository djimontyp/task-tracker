# Discovery Phase Checklist

Detailed checklist for Phase 2 of frontend-flow.

## Storybook MCP Commands

**Before creating ANY component, run:**

```bash
# List all existing components
storybook_list_components

# Get props API for specific component
storybook_get_component_props componentId="components-card"

# List stories for component
storybook_list_stories componentId="components-card"
```

## Component Categories

| Category | Path | Examples |
|----------|------|----------|
| UI Primitives | `shared/ui/` | Button, Badge, Card, Input |
| Patterns | `shared/patterns/` | CardWithStatus, EmptyState, FormField |
| Business | `shared/components/` | DataTable, MetricCard, ActivityHeatmap |
| Features | `features/*/components/` | TopicCard, ProviderCard, RunCard |

## Reuse Priority

1. **Existing component as-is** — best option
2. **Extend existing component** — add props/variants
3. **Compose from patterns** — use CardWithStatus, EmptyState
4. **Create new from tokens** — last resort

## Vault Search Queries

```bash
# Search for patterns
/obsidian:search "card pattern"
/obsidian:search "empty state"
/obsidian:search "status badge"

# Search for decisions
/obsidian:search "token usage"
/obsidian:search "spacing grid"
```

## AGENTS.md Quick Reference

**Must read before coding:**
- `frontend/AGENTS.md` — AI coding rules (compact)

**Key rules:**
- Touch targets ≥ 44px (`h-11 w-11`)
- Semantic colors only (no `bg-red-500`)
- 4px spacing grid (no `gap-3`, `p-5`)
- Icon buttons require `aria-label`
- Status = Icon + Text (not color only)

## Checkpoint Questions

Before proceeding to Implementation:

- [ ] Did I check Storybook for existing components?
- [ ] Did I search vault for related patterns/decisions?
- [ ] Did I read AGENTS.md rules?
- [ ] Can I reuse or extend instead of creating new?

If any answer is "No" → Complete discovery first!