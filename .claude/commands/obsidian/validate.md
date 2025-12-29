---
description: Quick YAML frontmatter and wikilinks validation for Obsidian vault
argument-hint: [--strict|--fix|path/to/file.md]
allowed-tools: Read(*), Glob(*), Grep(*), Bash(find:*), Write(*)
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json

## User Input

```
$ARGUMENTS
```

## Purpose

**Validate** = fast health check for Obsidian vault integrity:
- YAML frontmatter schema validation
- Wikilinks existence check
- Broken link detection
- Quick pre-commit validation

Unlike `/obsidian:sync`, this is **read-only by default** and focused on validation only.

## Arguments

| Arg | Description |
|-----|-------------|
| (none) | Validate all .md files in vault |
| `--strict` | Fail on any warning |
| `--fix` | Auto-fix missing frontmatter |
| `path/to/file.md` | Validate specific file |

## Validation Rules

### 1. YAML Frontmatter (Required)

**Knowledge files** (`знання/**/*.md`):
```yaml
---
id: string (required)
title: string (required)
type: concept|flow|model|decision|source (required)
status: draft|review|approved (required)
created: YYYY-MM-DD (required)
updated: YYYY-MM-DD (required)
author: string (required)
version: string (optional, default "1.0.0")
tags: [list] (optional)
---
```

**Journal files** (`Workspace/Journal/**/*.md`):
```yaml
---
type: journal (required)
date: YYYY-MM-DD (required)
author: string (required)
---
```

**Handoff files** (`.artifacts/handoff/*.md`):
```yaml
---
task_id: PR-XX (required)
created: ISO8601 (required)
agent: string (optional)
---
```

### 2. Wikilinks Validation

Check all `[[link]]` and `[[link|alias]]` patterns:
- Target file must exist in vault
- Path must be relative to vault root
- No broken external links

### 3. Structure Validation

- No orphan files (not linked from anywhere)
- No circular references
- Changelog section present in Knowledge files

## Algorithm

```python
def validate(path=None, strict=False, fix=False):
    errors = []
    warnings = []

    files = [path] if path else glob(".obsidian-docs/**/*.md")

    for file in files:
        # 1. Parse frontmatter
        frontmatter = parse_yaml(file)
        if not frontmatter:
            errors.append(f"{file}: missing frontmatter")
            continue

        # 2. Check required fields by type
        required = get_required_fields(file)
        for field in required:
            if field not in frontmatter:
                if fix:
                    add_field(file, field, default_value(field))
                else:
                    errors.append(f"{file}: missing {field}")

        # 3. Check wikilinks
        links = extract_wikilinks(file)
        for link in links:
            target = resolve_link(link)
            if not exists(target):
                errors.append(f"{file}: broken link [[{link}]]")

        # 4. Knowledge-specific checks
        if "знання/" in file:
            if "## Changelog" not in content:
                warnings.append(f"{file}: missing Changelog section")

    return {"errors": errors, "warnings": warnings}
```

## Output

```
🔍 Obsidian Vault Validation
════════════════════════════════════════

📁 Scanned: 57 files

✅ YAML Frontmatter
   Valid: 55
   Invalid: 2
     - знання/концепції/topic-hierarchy.md: missing 'author'
     - Workspace/Journal/2025-12-29.md: missing 'type'

⚠️ Wikilinks
   Valid: 120
   Broken: 3
     - знання/flows/extraction-flow.md: [[missing-page]]
     - плани/weekly.md: [[архів/old-note]]
     - шаблони/handoff.md: [[non-existent]]

ℹ️ Warnings
   - знання/концепції/atoms.md: missing Changelog section
   - знання/концепції/topics.md: missing Changelog section

════════════════════════════════════════
❌ Validation FAILED: 5 errors, 2 warnings

Run with --fix to auto-repair frontmatter
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All valid |
| 1 | Errors found |
| 2 | Warnings only (with --strict: treated as error) |

## Integration

**Pre-commit hook:**
```bash
# In .husky/pre-commit or scripts/workflow-preflight.sh
obsidian_validate() {
    # Run validation
    # If errors, block commit
}
```

**CI Check:**
```yaml
- name: Validate Obsidian vault
  run: claude "/obsidian:validate --strict"
```

## Examples

```bash
/obsidian:validate                              # validate all
/obsidian:validate --strict                     # fail on warnings
/obsidian:validate --fix                        # auto-fix frontmatter
/obsidian:validate знання/концепції/atoms.md    # validate one file
```

## Response

In Ukrainian:
- ✅ Vault valid: {files} files checked
- ❌ Validation failed: {errors} errors, {warnings} warnings
- 🔧 Fixed: {count} frontmatter issues