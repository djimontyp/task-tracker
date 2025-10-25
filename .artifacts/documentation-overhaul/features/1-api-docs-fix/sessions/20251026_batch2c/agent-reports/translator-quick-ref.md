# Batch 2C - Translator Quick Reference (Batch 2D Preparation)

**Document**: `docs/content/en/api/knowledge.md` → `docs/content/uk/api/knowledge.md`
**Batch**: 2D - Ukrainian Translation
**Source**: English version completed in Batch 2C
**Date**: October 26, 2025

---

## Key Changes to Translate (Batch 2C)

### Change 1: New Section - Related API Operations (Lines 719-765)

**Header Text to Translate**:
```english
## Related API Operations

The Knowledge Extraction API creates and manages topics and atoms that can be
further refined through dedicated management endpoints.
```

**Three Subsections** with tables containing:
- **Topics Management** (8 operations) - Lines 723-740
- **Atoms Management** (6 operations) - Lines 741-756
- **Versioning Operations** (8 operations) - Lines 757-764

**DO NOT TRANSLATE**:
- HTTP method names (GET, POST, PATCH, DELETE)
- Endpoint paths (`/api/v1/...`)
- Anchor links (`#topics-management`, etc.)

**DO TRANSLATE**:
- Table headers: "Operation | Endpoint | Description"
- Description text for each operation
- Tip/warning labels and content

### Change 2: Three Inline Cross-Reference Notes

**Note 1 - After topic_created event (Lines 283-284)**:
```english
!!! info "Related Operations"
    After receiving this event, use the **Topics Management API** to refine
    the topic: update descriptions, add icons/colors, link atoms, or retrieve
    related messages. See [Topics Management](#topics-management) for available endpoints.
```

**Note 2 - After atom_created event (Lines 309-310)**:
```english
!!! info "Related Operations"
    Use the **Atoms Management API** to further refine atoms: update titles/content,
    change types, approve/reject auto-classifications, or link atoms together.
    See [Atoms Management](#atoms-management) for available endpoints.
```

**Note 3 - After version_created event (Lines 387-388)**:
```english
!!! info "Related Operations"
    Use the **Versioning Operations API** to review and manage version changes:
    view version history, compare versions, or approve/reject changes.
    See [Versioning Operations](#versioning-operations) for available endpoints.
```

**DO NOT TRANSLATE**:
- Section names in square brackets: `[Topics Management]`, etc.
- Anchor links: `(#topics-management)`, etc.
- API names: "Topics Management API", "Atoms Management API", "Versioning Operations API"

**DO TRANSLATE**:
- Info label: `!!! info` → `!!! інформація` (or equivalent in Ukrainian)
- All descriptive text
- The action verbs and instructions

---

## Terminology Reference

### Key Terms (From Batch 2A & 2B - Already Translated)

| English | Ukrainian Context | Usage |
|---------|---|---|
| Knowledge Extraction API | Already translated in Batch 2A | Maintain consistency |
| Topic | Already translated in Batch 2A | Maintain consistency |
| Atom | Already translated in Batch 2A | Maintain consistency |
| Version | Already translated in Batch 2A | Maintain consistency |
| Agent configuration | Already translated in Batch 2A | Maintain consistency |
| WebSocket | Keep as-is (technical term) | Don't translate |

### New Terms in Batch 2C

| English | Notes | Type |
|---------|-------|------|
| Related Operations | New section header | Translate |
| Topics Management | API section name | Translate, but keep consistent with related section names |
| Atoms Management | API section name | Translate consistently |
| Versioning Operations | API section name | Translate consistently |
| CRUD | Abbreviation (Create, Read, Update, Delete) | Usually kept as CRUD or explain once in first appearance |

### API Endpoint Names (DO NOT TRANSLATE)

```
/api/v1/topics
/api/v1/atoms
/api/v1/versions
GET, POST, PATCH, DELETE
```

---

## Table Translation Guidelines

### Topics Management Table Structure

**English Header**: `| Operation | Endpoint | Description |`

**Structure to Maintain**:
```markdown
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **List** | `GET /api/v1/topics` | Retrieve all topics with pagination |
...
```

**What Changes**:
- "Operation" header → translate
- "Endpoint" header → translate or keep (technical)
- "Description" header → translate
- Operation names: "List", "Get by ID", etc. → translate as action verbs
- Endpoint paths → **DO NOT CHANGE**
- Description text → translate fully

**Example Translation Pattern**:
```markdown
| Операція | Endpoint | Опис |
|----------|----------|------|
| **Список** | `GET /api/v1/topics` | Отримати всі теми з пагінацією |
```

---

## Admonition Translation

### Current Format in English
```markdown
!!! tip "Topic Enhancement"
    After extraction creates topics, use the Topics API to refine descriptions,
    add custom icons/colors, or reorganize the hierarchy.
```

### Translation Pattern
```markdown
!!! tip "Покращення теми"
    Після того як видобування створює теми, використовуйте API управління темами
    для уточнення описів, додавання користувацьких значків/кольорів або
    реорганізації ієрархії.
```

**Keep Consistent**:
- Admonition type (`!!! tip`, `!!! info`, `!!! warning`)
- Quote marks around title
- Indentation of content

---

## Cross-Reference Links (DO NOT CHANGE)

All anchor links must remain in English:

```markdown
# DO NOT TRANSLATE
[Topics Management](#topics-management)
[Atoms Management](#atoms-management)
[Versioning Operations](#versioning-operations)

# These anchor links must match the section headers exactly in lowercase
## Topics Management → #topics-management
## Atoms Management → #atoms-management
## Versioning Operations → #versioning-operations
```

If you translate section headers, you MUST also translate the anchor links:

```markdown
# Example (if translating to Ukrainian)
## Управління темами → #управління-темами
[Управління темами](#управління-темами)
```

**IMPORTANT**: Keep anchor links consistent across the entire document.

---

## Format Checklists

### Before Translation
- [ ] Read entire English section (Batch 2C)
- [ ] Identify all sections needing translation
- [ ] Note which content stays in English (endpoints, code)
- [ ] Prepare terminology glossary

### During Translation

**For each table**:
- [ ] Translate headers
- [ ] Translate operation names
- [ ] Keep endpoint paths unchanged
- [ ] Translate descriptions fully
- [ ] Maintain table structure (pipes, dashes)

**For each admonition**:
- [ ] Keep admonition type unchanged
- [ ] Translate title in quotes
- [ ] Translate content fully
- [ ] Maintain indentation

**For each cross-reference**:
- [ ] Translate the visible link text
- [ ] Translate the anchor if you translated the section header
- [ ] Ensure anchor matches section header exactly

### After Translation
- [ ] Verify all tables render correctly
- [ ] Check all anchor links work
- [ ] Confirm no English text left untranslated (except endpoints)
- [ ] Test markdown formatting
- [ ] Compare structure with English version

---

## Common Translation Decisions to Document

### Decision 1: "Related Operations" Section Name

In Ukrainian, consider:
- "Пов'язані операції" (related operations)
- "Операції управління" (management operations)
- "Пов'язані API" (related APIs)

**Recommended**: Use whatever was decided for the glossary in earlier batches. Check Batch 2A/2B Ukrainian files for consistency.

### Decision 2: API Section Names

The three subsection names should be:
- **Topics Management** → Probably "Управління темами" (consistent with glossary)
- **Atoms Management** → Probably "Управління атомами" (consistent with glossary)
- **Versioning Operations** → Probably "Операції версіонування" or "Управління версіями" (consistent with glossary)

**Check**: Verify these translations in the Batch 2A/2B Ukrainian files where "Topic API", "Atom API", etc. might be mentioned.

### Decision 3: Action Verbs in Tables

Operations in tables use verbs like: List, Get by ID, Create, Update, Delete, Link, Approve, Reject

**Pattern**: Translate these as infinitives or third-person singular forms consistently:
- List → Отримати список / Список
- Get by ID → Отримати за ID
- Create → Створити
- Update → Оновити
- Delete → Видалити
- Link → Пов'язати
- Approve → Затвердити
- Reject → Відхилити

Use the same verb forms consistently across all three tables.

---

## Batch 2C Translation Workflow

### Step 1: Preparation (Before Starting)
1. Read the English Batch 2C document completely
2. Compare with Batch 2A/2B Ukrainian translations to maintain consistency
3. Extract key terminology to translate consistently
4. Document any translation decisions

### Step 2: Translation (Main Work)
1. Translate "## Related API Operations" header
2. Translate introductory paragraph
3. Translate "### Topics Management" section
   - Translate section header
   - Translate table headers
   - Translate all operation descriptions
   - Translate admonition
4. Repeat for Atoms Management section
5. Repeat for Versioning Operations section
6. Translate all three inline cross-reference notes

### Step 3: Verification (Quality Check)
1. Verify all tables render with proper markdown syntax
2. Check all anchor links are correct
3. Compare terminology with earlier batches
4. Ensure no endpoint paths were accidentally translated
5. Verify admonition formatting maintained

### Step 4: Final Review
1. Read through entire translated section
2. Compare side-by-side with English for completeness
3. Check consistency of technical terms
4. Verify all formatting preserved

---

## Questions for Ukrainian Translator

Before starting, confirm with the project team:

1. **Terminology**: What are the agreed Ukrainian translations for:
   - Topics API / Topics Management
   - Atoms API / Atoms Management
   - Versions API / Versioning Operations
   - Related Operations / Related APIs

2. **Format**: Should anchor links remain in English or be translated?
   - Recommendation: Keep in English (easier for developers to reference)

3. **Verb consistency**: How are action verbs in tables consistently translated?
   - Example: Is "List" translated as "Список" or "Отримати список"?

4. **API naming**: Should "Topics Management API" be translated or kept in English?
   - Recommendation: Follow whatever was decided in Batch 2A/2B

---

## Helpful Resources

**Files to Review for Consistency**:
- `docs/content/uk/api/knowledge.md` - Previous translation (if exists from earlier batches)
- `docs/content/uk/topics.md` - Topic terminology references
- Batch 2A & 2B Ukrainian output (terminology glossary)

**Translation Tools**:
- MkDocs Material - Supported markdown syntax in Ukrainian
- Any project terminology glossary/style guide

---

## Support

If any issues arise during translation:
1. Check the English version (lines 719-765) for original context
2. Compare with Batch 2A/2B translations for terminology consistency
3. Refer to this quick reference guide
4. Document any translation decisions for future reference

---

**English Batch 2C Status**: ✅ COMPLETE & READY FOR TRANSLATION

**Next**: Batch 2D - Ukrainian Translation (These Guidelines Apply)
