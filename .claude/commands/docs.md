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

## MkDocs Material Features

This project uses MkDocs Material v9.x with modern markdown extensions. Use these features to create professional, user-friendly documentation.

### Content Organization

**Grids for Feature Showcases:**
```markdown
<div class="grid cards" markdown>

- :material-flash: **Fast Feature**

    Brief description of the feature

- :material-brain: **Smart Feature**

    Another feature description

</div>
```

**Content Tabs for Multi-Platform Examples:**
```markdown
=== "Python"
    ```python
    async def example():
        return await db.query()
    ```

=== "TypeScript"
    ```typescript
    async function example() {
        return await fetch('/api')
    }
    ```
```

**Use tabs for:**
- Multi-language code examples
- Platform-specific instructions (Docker, local, cloud)
- Alternative approaches to same task

### Code Documentation

**Code Annotations for Complex Logic:**
```python
async def analyze_message(msg: Message):  # (1)!
    score = score_importance(msg)  # (2)!
    if score > config.threshold:  # (3)!
        await emit_signal(msg)

1. Messages from Telegram webhook
2. 4-factor algorithm: length, keywords, recency, author
3. Threshold configurable via ProjectConfig
```

**When to annotate:**
- Complex algorithms or business logic
- Non-obvious configuration values
- Performance-critical sections
- Integration points with external systems

### Typography & Formatting

**Abbreviations for Technical Terms:**
```markdown
The system uses RAG for enhanced context.

*[RAG]: Retrieval-Augmented Generation
```

**Keyboard Shortcuts:**
```markdown
Press ++ctrl+k++ to search
Use ++cmd+shift+p++ for commands
```

**Text Formatting:**
- ==Highlighted text== for important concepts (requires `pymdownx.mark`)
- H~2~O for subscripts (requires `pymdownx.tilde`)
- x^2^ for superscripts (requires `pymdownx.caret`)

### Admonitions

**Basic syntax:**
```
!!! note
    Content must be indented (4 spaces or 1 tab).

!!! tip "Custom Title"
    You can add a custom title.

!!! warning ""
    Empty quotes remove the title.
```

**Available types:**
- `note` - Additional information
- `tip` - Helpful suggestions
- `info` - General information
- `warning` - Important warnings
- `danger` - Critical alerts
- `success` - Positive outcomes
- `example` - Usage examples
- `quote` - Quotations

**Collapsible admonitions:**
```
??? note "Click to expand"
    Starts collapsed.

???+ tip "Expanded by default"
    Starts open, can be collapsed.
```

**Admonitions with code:**
```markdown
???+ example "Example with code"
    This is text.

    ```python
    # Note the empty line above
    def example():
        pass
    ```

    More text after code.
```

### Search Optimization

**Boost important pages:**
```markdown
---
search:
  boost: 2
---

# Important Page Title
```

**Use for:**
- Getting started guides
- API reference pages
- Common troubleshooting guides

### Visual Design Patterns

**Landing Pages:**
1. Start with overview in info/tip admonition
2. Use grids/cards for feature highlights
3. Add Mermaid diagrams for architecture
4. Include quick navigation links

**Architecture Pages:**
1. Overview diagram (Mermaid)
2. Component descriptions in grid cards
3. Technical details in expandable notes
4. Code examples with annotations

**Feature Documentation:**
1. Quick overview (what it does)
2. Use cases with examples
3. Multi-language code in tabs
4. Related documentation links

### Common Patterns

**Multi-step processes:**
1. Use numbered lists for sequential steps
2. Add code examples for each step
3. Use admonitions for warnings/tips
4. Include troubleshooting section

**API endpoints:**
1. Request/response in content tabs
2. Authentication in warning admonition
3. Error scenarios with examples
4. Code annotations for parameters

**Configuration guides:**
1. Overview of what's being configured
2. Default values in tables
3. Examples with annotations
4. Common issues in warning admonitions

### Troubleshooting Tips

**MkDocs build fails:**
- Check indentation in admonitions (must be 4 spaces or 1 tab)
- Verify markdown extension is enabled in mkdocs.yml
- Ensure code blocks have proper language tags

**Content tabs not working:**
- Requires `pymdownx.tabbed` with `alternate_style: true`
- Tab content must be indented
- Use `===` for tab labels

**Icons not showing:**
- Requires `pymdownx.emoji` with Material emoji config
- Use `:material-icon-name:` syntax
- Check icon exists in Material Icons set

### Basic Markdown

**Headings:**
- `#` Main title (once per page)
- `##` Major sections
- `###` Subsections
- `####` Minor subsections

**Lists:**
- Unordered: `-` or `*`
- Ordered: `1.`, `2.`
- Task lists: `- [ ]` and `- [x]`

**Links:**
- Internal: `[Text](other-page.md)`
- External: `[Text](https://example.com)`
- Anchors: `[Text](#section-heading)`

**Emphasis:**
- **Bold** with `**text**`
- *Italic* with `*text*`
- `Inline code` with backticks

**Tables:**
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Value    | Value    |
```

Use these features to make documentation scannable, organized, and visually appealing.