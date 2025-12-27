# Data Model: i18n Internationalization

**Feature Branch**: `005-i18n`
**Date**: 2025-12-14

## Overview

Two-level localization model:
1. **User-level** — UI language preference (per-user setting)
2. **Project-level** — AI content generation language (per-project setting)

---

## Entity Changes

### 1. User (Existing Model Extension)

**File:** `backend/app/models/user.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ui_language` | `str` | `"uk"` | User's UI language preference (ISO 639-1: `uk`, `en`) |

**Validation:**
- Enum constraint: `["uk", "en"]`
- Max length: 10 characters

**Example:**
```python
class User(IDMixin, TimestampMixin, SQLModel, table=True):
    # ... existing fields ...

    ui_language: str = Field(
        default="uk",
        max_length=10,
        description="UI language preference (ISO 639-1 code)"
    )
```

---

### 2. ProjectConfig (Existing Model Extension)

**File:** `backend/app/models/project_config.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `language` | `str` | `"uk"` | Project's AI content language (ISO 639-1) |

**Validation:**
- Enum constraint: `["uk", "en"]`
- Max length: 10 characters

**Example:**
```python
class ProjectConfig(SQLModel, table=True):
    # ... existing fields ...

    language: str = Field(
        default="uk",
        max_length=10,
        description="Language for AI-generated content (ISO 639-1 code)"
    )
```

---

### 3. AgentConfig (Domain Model Extension)

**File:** `backend/app/llm/domain/models.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt_variants` | `dict[str, str] \| None` | `None` | System prompts by language |

**Structure:**
```python
prompt_variants: dict[str, str] | None = Field(
    default=None,
    description="Language-specific system prompts: {'uk': '...', 'en': '...'}"
)

def get_system_prompt(self, language: str = "uk") -> str:
    """Get system prompt for specified language."""
    if self.prompt_variants and language in self.prompt_variants:
        return self.prompt_variants[language]
    return self.system_prompt or ""
```

---

## Database Schema Changes

### Migration: Add Language Fields

**File:** `alembic/versions/xxx_add_i18n_fields.py`

```sql
-- Add ui_language to users table
ALTER TABLE users
ADD COLUMN ui_language VARCHAR(10) DEFAULT 'uk' NOT NULL;

-- Add language to project_configs table
ALTER TABLE project_configs
ADD COLUMN language VARCHAR(10) DEFAULT 'uk' NOT NULL;

-- Add check constraints
ALTER TABLE users
ADD CONSTRAINT check_ui_language
CHECK (ui_language IN ('uk', 'en'));

ALTER TABLE project_configs
ADD CONSTRAINT check_project_language
CHECK (language IN ('uk', 'en'));
```

---

## API Schema Updates

### UserResponse (Extended)

**File:** `backend/app/schemas/users.py`

```python
class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str | None
    full_name: str
    email: str | None
    phone: str | None
    avatar_url: str | None
    is_active: bool
    is_bot: bool
    ui_language: str  # NEW
    created_at: datetime | None
    updated_at: datetime | None
```

### UserUpdateRequest (New)

```python
class UserUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    avatar_url: str | None = None
    ui_language: str | None = None  # NEW
```

### ProjectConfigCreate/Update (Extended)

```python
class ProjectConfigCreate(SQLModel):
    name: str
    description: str
    keywords: list[str]
    language: str = "uk"  # NEW
    # ... other fields
```

---

## Frontend State Model

### Language Store (Zustand)

**File:** `frontend/src/shared/store/uiStore.ts`

```typescript
interface UiStore {
  // Existing
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  isAdminMode: boolean

  // NEW
  language: 'uk' | 'en'
  setLanguage: (lang: 'uk' | 'en') => void
}
```

**Persistence:** localStorage key `ui-settings`

---

## Translation Resource Structure

### Namespace Schema

```typescript
interface TranslationResources {
  common: {
    actions: {
      save: string
      cancel: string
      delete: string
      edit: string
      // ...
    }
    navigation: {
      dashboard: string
      messages: string
      topics: string
      // ...
    }
    // ...
  }
  atoms: {
    type: {
      task: string
      idea: string
      question: string
      decision: string
      insight: string
    }
    status: {
      draft: string
      pending_review: string
      approved: string
      rejected: string
    }
    // ...
  }
  // ... other namespaces
}
```

---

## State Transitions

### User Language Change Flow

```
┌─────────────────┐
│  Settings Page  │
└────────┬────────┘
         │ User selects language
         ▼
┌─────────────────┐
│  Zustand Store  │ ← Updates localStorage
└────────┬────────┘
         │ Calls i18n.changeLanguage()
         ▼
┌─────────────────┐
│  react-i18next  │ ← All components re-render
└────────┬────────┘
         │ Debounced (500ms)
         ▼
┌─────────────────┐
│  Backend PATCH  │ ← Persists to User.ui_language
└─────────────────┘
```

### Project Language at AI Execution

```
┌─────────────────┐
│  Message Ingest │
└────────┬────────┘
         │ Get project.language
         ▼
┌─────────────────┐
│  Select Prompt  │ ← agent.get_system_prompt(language)
└────────┬────────┘
         │ Execute LLM
         ▼
┌─────────────────┐
│  Validate Lang  │ ← langdetect(output)
└────────┬────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
    Yes  │  No
    ▼    ▼
 Save   Retry with
        strengthened
        prompt
```

---

## Relationships

```
User (1) ──────────────── (*) Session
  │                           │
  │ ui_language               │ uses language
  │                           │
  ▼                           ▼
UI Rendering              Translation
                          Resources

ProjectConfig (1) ─────── (*) Atom
  │                           │
  │ language                  │ generated in
  │                           │ project.language
  ▼                           ▼
AI Prompts                AI Output
(prompt_variants)
```

---

## Validation Rules

### Language Code Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `User.ui_language` | Must be in `["uk", "en"]` | "Invalid language code" |
| `ProjectConfig.language` | Must be in `["uk", "en"]` | "Invalid language code" |

### Translation Key Validation

- TypeScript compile-time validation via module augmentation
- Missing key falls back to key itself (`t('missing.key')` → `"missing.key"`)
- Warning logged in development mode

---

## Index Requirements

No new indexes required — language fields are used for selection, not search.

---

## Future Considerations

### Extensibility for New Languages

When adding new language (e.g., Polish `pl`):
1. Add to enum constraint in migration
2. Create `public/locales/pl/` translation files
3. Add prompt variants to relevant agents
4. Update TypeScript types
