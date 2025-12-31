 # Documentation & Knowledge Capture

Templates and guidelines for Phase 6 of frontend-flow.

## Journal Session Commands

### Start Session

```bash
/obsidian:journal session "TopicCard component"
```

### End Session with Findings

```bash
/obsidian:journal done
```

## Finding Wikilink Format

Use wikilinks to connect findings to knowledge base:

```markdown
**Findings:**
- [[знання/паттерни/topic-card-composition]] — card pattern with status
- [[знання/рішення/use-cardwithstatus-base]] — extend pattern decision
- [[знання/помилки/missing-aria-label]] — accessibility fix
```

## Knowledge Categories

| Category | Path | Use for |
|----------|------|---------|
| Patterns | `знання/паттерни/` | Reusable approaches |
| Decisions | `знання/рішення/` | Architectural choices |
| Mistakes | `знання/помилки/` | Problems to avoid |

## Auto-Capture

After session ends, capture learnings:

```bash
/obsidian:capture auto
```

This creates notes from findings in journal.

## Beads Update

Update issue progress:

```bash
# Add progress comment
bd comments add PR-123 "TopicCard: component + story created, verification passed"

# Update status (optional)
bd update PR-123 --status in-progress
```

## Handoff Template

End of session, prepare for next:

```markdown
## Handoff for next session

**Completed:**
- TopicCard component implemented
- 5 stories created with autodocs
- All verification passed

**Next steps:**
- Add unit tests for edge cases
- Consider adding WithActions story

**Context:**
- Based on CardWithStatus pattern
- Uses semantic tokens throughout
- Follows 4px spacing grid

**Files touched:**
- frontend/src/features/topics/components/TopicCard.tsx
- frontend/src/features/topics/components/TopicCard.stories.tsx
```

## Finding Note Template

When creating knowledge note from finding:

```markdown
---
title: "Pattern Name"
created: 2025-01-01
source:
  type: implementation
  ref: "PR-123"
tags:
  - паттерн
  - auto-captured
---

# Problem

What problem was encountered.

# Solution

What approach worked.

# When to Use

When this pattern applies.

# When NOT to Use

When to avoid this pattern.

# Code Example

\`\`\`tsx
// Example implementation
\`\`\`

# Related

- [[other-pattern]]
- [[related-decision]]
```

## Session Checklist

Before ending session:

- [ ] All findings documented as wikilinks
- [ ] Learnings captured with `/obsidian:capture auto`
- [ ] Beads issue updated with progress
- [ ] Handoff prepared for next session