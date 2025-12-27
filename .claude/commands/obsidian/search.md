---
description: Search Obsidian vault
argument-hint: <query> — text, #tag, or [[note]] for backlinks
allowed-tools: Read(*), Glob(*), Grep(*)
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json

## User Input

```
$ARGUMENTS
```

## Algorithm

Analyze `$ARGUMENTS` and determine search type:

### 1. Tag search `#tag`

If query starts with `#`:
- Search `#tag` or `tags: [...tag...]` in frontmatter
- Show list of files with this tag

**Search paths:**
- `Knowledge/**/*.md`
- `Workspace/**/*.md`

### 2. Backlinks search `[[note]]`

If query contains `[[...]]`:
- Extract note name
- Search all files that reference `[[note]]` or `[[note|alias]]`
- Show list of backlinks

### 3. Content search (default)

- Search query in all `.md` files in vault
- Exclude `.obsidian/` folder
- Show files and context (lines around match)

**Search paths:**
- `Knowledge/**/*.md`
- `Workspace/**/*.md`

### 4. Type search `type:concept`

If query starts with `type:`:
- Search by frontmatter type field
- Types: concept, flow, model, decision, source, question, journal, retro

## Response Format

In Ukrainian:

**For tags:**
```
🏷️ Notes with tag #tag:

1. Knowledge/Concepts/concept-auth.md
2. Knowledge/Flows/flow-registration.md
...

Found: N files
```

**For backlinks:**
```
🔗 Backlinks to [[note]]:

1. Knowledge/Concepts/concept-auth.md:45 — "See [[note]] for details"
2. Workspace/Journal/2025/12/2025-12-19.md:12 — "Used [[note|alias]]"
...

Found: N references
```

**For content:**
```
🔍 Results for "query":

📄 Knowledge/Concepts/concept-auth.md
   L23: ...context with query...
   L45: ...another match...

📄 Workspace/Journal/2025/12/2025-12-19.md
   L12: ...context...

Found: N files, M matches
```

**For type search:**
```
📁 Notes of type "concept":

1. Knowledge/Concepts/concept-auth.md — Автентифікація
2. Knowledge/Concepts/concept-review.md — Відгуки
...

Found: N files
```

**If nothing found:**
```
🔍 Nothing found for "query"

💡 Try:
- Different keywords
- Tag search: /obsidian:search #tag
- Type search: /obsidian:search type:concept
- View structure: /obsidian:sync
```

## History Update

```json
{
  "learning": {
    "history": {
      "commands_executed": { "search": +1 },
      "last_activity": "2025-12-19"
    }
  }
}
```

## Examples

```bash
/obsidian:search auth              # content search
/obsidian:search #concept          # tag search
/obsidian:search [[concept-auth]]  # backlinks
/obsidian:search type:flow         # type search
```