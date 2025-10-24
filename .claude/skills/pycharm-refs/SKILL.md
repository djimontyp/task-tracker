---
name: pycharm-refs
description: This skill should be used when agents need to provide clickable code references to users in reports, investigations, or bug findings. It ensures file references use the file:// protocol with absolute paths and line numbers for immediate navigation in PyCharm/JetBrains IDEs. Do not use for general documentation or conceptual explanations.
---

# PyCharm-Style Clickable Code References

## Overview

When providing code references to users that require immediate action or investigation, use clickable file:// URLs with absolute paths and line numbers. This enables users to click and jump directly to the relevant code in their IDE.

## Critical Format Rule

**ALWAYS use absolute paths with file:// protocol:**

```
file:///ABSOLUTE_PATH_TO_FILE:LINE_NUMBER
```

**Working directory context:** `{{env.WORKING_DIRECTORY}}`

## When to Use This Format

Apply clickable references in these contexts:

- **Investigation reports** - Locations of bugs, performance bottlenecks, or issues
- **Analysis results** - Findings from code analysis or audits
- **Bug reports** - Specific locations where errors originate
- **Code review findings** - Problematic code segments that need attention
- **Implementation summaries** - Key changes made during development
- **Error locations** - Where exceptions or failures occur

The common pattern: if the user needs to **look at specific code right now**, make it clickable.

## When NOT to Use This Format

Skip clickable links in these contexts:

- **General documentation** - Architectural overviews, concept explanations
- **Conceptual references** - Discussing patterns or approaches without specific implementation
- **File structure descriptions** - Listing directory organization
- **Non-actionable mentions** - References that don't require user inspection

The common pattern: if the reference is **conceptual or documentary**, omit clickable links.

## Format Specifications

### Single Line Reference (Clickable)
```
file:///Users/maks/PycharmProjects/task-tracker/backend/app/services/task_service.py:45
```

### Line Range Reference
Note: PyCharm file:// protocol doesn't support ranges, use single line:
```
file:///Users/maks/PycharmProjects/task-tracker/frontend/src/features/agents/components/TaskForm.tsx:127
```

### In Natural Language
```
Found performance bottleneck in the task classification loop at
file:///Users/maks/PycharmProjects/task-tracker/backend/app/services/classification.py:156
```

### Multiple References
```
The validation error chain:
1. file:///Users/maks/PycharmProjects/task-tracker/frontend/src/features/agents/components/TaskForm.tsx:89
2. file:///Users/maks/PycharmProjects/task-tracker/backend/app/api/routes/tasks.py:234
3. file:///Users/maks/PycharmProjects/task-tracker/backend/app/services/validation.py:67
```

## Examples

### ✅ Good Usage (Actionable Report)

```markdown
## Performance Analysis Results

Identified slow database queries:

1. N+1 query in task fetching
   file:///Users/maks/PycharmProjects/task-tracker/backend/app/services/task_service.py:156

2. Missing index on topic_messages join
   file:///Users/maks/PycharmProjects/task-tracker/backend/app/models/topic.py:45

3. Inefficient serialization in API response
   file:///Users/maks/PycharmProjects/task-tracker/backend/app/api/routes/topics.py:89
```

### ✅ Good Usage (Bug Report)

```markdown
## TypeError in Task Creation

The error originates from missing validation:
file:///Users/maks/PycharmProjects/task-tracker/frontend/src/features/agents/components/TaskForm.tsx:127

Root cause in schema definition:
file:///Users/maks/PycharmProjects/task-tracker/backend/app/schemas/task.py:34
```

### ❌ Bad Usage (Documentation Context)

```markdown
## Architecture Overview

The service layer is organized in backend/app/services/
with helper utilities in backend/app/services/utils.py
```

**Why bad:** This is architectural documentation, not an actionable reference. No need for clickable links.

### ❌ Bad Usage (Conceptual Reference)

```markdown
## Design Patterns

We use dependency injection throughout the codebase, see backend/app/api/dependencies.py for examples.
```

**Why bad:** This is a conceptual explanation. The specific lines aren't relevant to understanding the pattern.

## Implementation Guidelines

When writing reports or providing findings:

1. **Get working directory** - Use `{{env.WORKING_DIRECTORY}}` or context to build absolute paths
2. **Identify context** - Is this report/investigation or documentation/concept?
3. **Check actionability** - Does the user need to inspect this code now?
4. **Use clickable format** - If actionable, use `file:///absolute/path/to/file:line_number`
5. **Omit if conceptual** - If discussing general architecture or patterns, use simple file paths without protocol

Keep references **contextual and actionable** - clickable links are for helping users navigate to code they need to see immediately, not for documenting general file locations.
