---
title: "Session Handoff: {{task_id}}"
created: {{date}}
task_id: "{{task_id}}"
agent: "{{agent_type}}"
tags:
  - handoff
  - workflow
---

# Session Handoff: {{task_id}}

## Task

**Title:** {{task_title}}
**Status:** completed | partial | blocked
**Duration:** {{duration}}

## Summary

1-2 речення що було зроблено.

## Files Changed

| File | Change | Reasoning |
|------|--------|-----------|
| `path/to/file.ts` | Added hook | Cleaner state management |
| `path/to/test.ts` | Added tests | Coverage for new feature |

## Decisions Made

### 1. {{Decision Name}}

- **What:** Що було вирішено
- **Alternatives:** Які варіанти розглядались
- **Why:** Чому обрали цей варіант

### 2. {{Decision Name}}

...

## Open Questions

- [ ] Question for next session or user
- [ ] Uncertainty that needs clarification

## Next Steps

1. Immediate next action
2. Follow-up action
3. Optional future improvement

## Dependencies

- **Blocked by:** none | [[PR-XX]]
- **Blocks:** [[PR-YY]] | none

## Reflection Link

Див. [[reflect-{{task_id}}]] для learnings.

## Пов'язане

- [[Workspace/Journal/{{date}}]] — журнал дня
- [[PR-{{parent_story}}]] — story
- [[PR-{{parent_epic}}]] — epic
