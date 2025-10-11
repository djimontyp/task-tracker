---
description: Create or update user documentation in both English and Ukrainian.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

# Documentation Command

You are creating or updating user-facing documentation for the Task Tracker project. The documentation is stored in `docs/content/` with separate `en/` and `uk/` subdirectories for English and Ukrainian versions.

## Important Guidelines

1. **Documentation Style**: Write user-facing guides without technical implementation details or code. Focus on concepts, workflows, and how users interact with features.

2. **Language Versions**: ALWAYS create BOTH English and Ukrainian versions of the documentation.

3. **File Location**:
   - If the user didn't specify a file path, analyze existing documentation structure in `docs/content/en/` and `docs/content/uk/`
   - Propose a logical file name based on the topic
   - Ask for confirmation: "I'll create/update this in `[filename].md`. Is this correct?"
   - Wait for user confirmation before proceeding

4. **Content Decision**:
   - If user request is empty or unclear, ask: "What would you like me to document?"
   - Clarify the scope and purpose before writing

5. **Update Strategy**:
   - For existing files: Update the relevant section, don't overwrite everything
   - For new files: Create complete documentation using existing docs as a style reference
   - After creating new files, update `docs/mkdocs.yml` to add them to navigation

6. **Navigation Updates**:
   - Read the current `docs/mkdocs.yml` nav structure
   - Add new pages in a logical location
   - Maintain consistency with existing navigation

## Workflow

1. Parse user input from $ARGUMENTS
2. If empty or unclear → ask what to document
3. Analyze existing docs structure (use Glob and Read tools)
4. Propose file location → wait for confirmation
5. Write English version to `docs/content/en/[filename].md`
6. Write Ukrainian version to `docs/content/uk/[filename].md`
7. If new file → update `docs/mkdocs.yml` navigation
8. Report completion with file paths

## Style Reference

Look at existing docs (like `docs/content/en/topics.md`) to maintain:
- Consistent tone and structure
- Clear section hierarchies
- User-focused language
- Practical examples and use cases

## Markdown Formatting

Use rich Markdown features for better readability (MkDocs Material theme supports these):

### Headings
- `#` Main title (once per page)
- `##` Major sections
- `###` Subsections
- `####` Minor subsections

### Lists
- Unordered lists with `-` or `*`
- Ordered lists with `1.`, `2.`, etc.
- Nested lists with proper indentation
- Task lists with `- [ ]` and `- [x]`

### Code Blocks
```python
# Use language-specific syntax highlighting
def example():
    pass
```

### Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value    | Value    | Value    |

### Callouts/Admonitions
Use these for important information:

```markdown
!!! note
    Additional information

!!! tip
    Helpful suggestions

!!! warning
    Important warnings

!!! danger
    Critical alerts

!!! info
    General information

!!! success
    Positive outcomes

!!! example
    Usage examples
```

### Collapsible Sections
```markdown
??? note "Click to expand"
    Hidden content here

???+ tip "Expanded by default"
    This section starts opened
```

### Links
- Internal: `[Link text](other-page.md)`
- External: `[Link text](https://example.com)`
- Anchors: `[Link to section](#section-heading)`

### Emphasis
- **Bold** with `**text**`
- *Italic* with `*text*`
- `Inline code` with backticks
- ~~Strikethrough~~ with `~~text~~`

### Horizontal Rules
Use `---` for section separators

### Blockquotes
> Use `>` for quotes or highlighted text

Use these formatting features appropriately to make documentation scannable, organized, and visually appealing.