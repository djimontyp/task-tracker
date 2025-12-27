# Research: i18n Internationalization

**Feature Branch**: `005-i18n`
**Date**: 2025-12-14

## Executive Summary

Two-level localization required:
1. **UI Language** — Frontend interface (react-i18next)
2. **Project Language** — AI-generated content (separate native prompts)

Ukrainian default; English for future SaaS expansion.

---

## Decision 1: Frontend i18n Library

### Choice: **react-i18next**

**Rationale:**
- Most mature & battle-tested (2011, 2.1M weekly downloads)
- Native React 18 hooks support (`useTranslation`)
- Instant language switching via `i18n.changeLanguage()`
- Excellent TypeScript support with module augmentation
- Works seamlessly with Zustand + Vite stack

**Alternatives Considered:**
| Library | Why Rejected |
|---------|--------------|
| react-intl | Steeper learning curve (ICU syntax), smaller ecosystem |
| LinguiJS | Smaller community (80K downloads), less documentation |
| formatjs | Same as react-intl (wrapper) |

**Bundle Size:** 22.2 kB (gzipped) — acceptable for enterprise features

---

## Decision 2: Translation File Structure

### Choice: **Namespace Pattern (Feature-based)**

```
public/locales/
├── en/
│   ├── common.json       # Shared UI (buttons, labels, nav)
│   ├── dashboard.json    # Dashboard-specific
│   ├── messages.json     # Messages module
│   ├── atoms.json        # Atoms CRUD
│   ├── topics.json       # Topics management
│   ├── settings.json     # Settings page
│   └── errors.json       # Error messages
└── uk/
    └── [same structure]
```

**Rationale:**
- Load only required namespaces per page (lazy loading)
- Easier maintenance (one file per domain)
- Prevents monolithic translation files
- Tree-shaking friendly

**JSON Nesting:** Max 3 levels (`atoms.type.task`)

---

## Decision 3: Ukrainian Pluralization

### Rules

Ukrainian uses **3 plural forms** (vs English 2):

| Suffix | Rule | Examples |
|--------|------|----------|
| `_one` | n % 10 == 1 AND n % 100 != 11 | 1, 21, 101 |
| `_few` | n % 10 ∈ [2,4] AND n % 100 ∉ [12,14] | 2-4, 22-24 |
| `_many` | All other | 0, 5-20, 25-30, 100 |

**Translation Example:**
```json
{
  "message_one": "1 повідомлення",
  "message_few": "{{count}} повідомлення",
  "message_many": "{{count}} повідомлень"
}
```

**Critical:** Use `uk` (not `ua`) as language code — i18next requires ISO 639-1.

---

## Decision 4: TypeScript Type Safety

### Choice: **Module Augmentation**

Create `src/i18n/types.ts`:
```typescript
import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../../public/locales/en/common.json');
      // ... other namespaces
    };
  }
}
```

**Benefits:**
- Full autocomplete for translation keys
- Compile-time errors for missing keys
- Zero runtime overhead

---

## Decision 5: Instant Language Switching

### Architecture

```
User clicks language → Zustand updates → i18n.changeLanguage()
                            ↓
                    All useTranslation() re-render
                            ↓
                    <100ms total (requirement met)
```

**Implementation:**
1. Zustand store with `persist` middleware (localStorage)
2. Call `i18n.changeLanguage()` on store update
3. Backend sync via debounced PATCH to `/api/v1/users/me`

---

## Decision 6: AI Prompt Localization

### Choice: **Separate Native Language Prompts**

**Research Finding:** Native language prompts achieve **14% absolute improvement** in validity rates vs English prompts with language instruction.

**Approach:**
1. Store prompt variants in `AgentConfig.prompt_variants` (JSONB)
2. Select prompt by `project.language` at execution time
3. Validate output language with `langdetect` library
4. Retry with strengthened instruction if wrong language detected

**Why NOT single prompt with instruction:**
- Lower accuracy
- Hallucinations in non-primary languages
- Cultural context lost

**Ukrainian Prompt Pattern:**
```
КРИТИЧНО: Ви ПОВИННІ відповідати ВИКЛЮЧНО українською мовою.
Обов'язково генеруйте всі поля (title, content, summary) українською.
```

---

## Decision 7: Language Detection Fallback

### Strategy

**Layer 1: Runtime Detection**
```python
from langdetect import detect

detected = detect(output_text)
if detected != expected_language:
    # Retry with stronger prompt
```

**Layer 2: Content Markers**
- Ukrainian: Check for ї, ґ, є characters
- Schema validation with Pydantic

**Layer 3: Warning Badge**
- If AI generates wrong language: show content with badge
- "Мова відрізняється від мови проєкту"

---

## Decision 8: Settings Page Integration

### Approach

Follow existing ThemeProvider pattern:
1. Add `language` to `uiStore.ts` (Zustand)
2. Create `useLanguage` hook
3. Add Language Card to GeneralTab.tsx (RadioGroup)

**UI Pattern:** RadioGroup with 2 options (English, Українська)

---

## Dependencies to Add

### Frontend
```bash
npm install i18next react-i18next i18next-http-backend
```

### Backend
```bash
pip install langdetect
```

---

## Files to Create/Modify

### Frontend
| File | Action |
|------|--------|
| `src/i18n/config.ts` | NEW — i18next configuration |
| `src/i18n/types.ts` | NEW — TypeScript declarations |
| `public/locales/en/*.json` | NEW — English translations |
| `public/locales/uk/*.json` | NEW — Ukrainian translations |
| `src/shared/store/uiStore.ts` | MODIFY — Add language state |
| `src/shared/hooks/useLanguage.ts` | NEW — Language hook |
| `src/pages/SettingsPage/components/GeneralTab.tsx` | MODIFY — Add language selector |
| `src/app/providers.tsx` | MODIFY — Add i18n provider |

### Backend
| File | Action |
|------|--------|
| `app/models/user.py` | MODIFY — Add `ui_language` field |
| `app/models/project_config.py` | MODIFY — Add `language` field |
| `app/schemas/users.py` | MODIFY — Add language to response |
| `app/services/knowledge/llm_agents.py` | MODIFY — Use prompt variants |
| `app/llm/domain/models.py` | MODIFY — Add language to AgentConfig |

---

## Sources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Pluralization](https://www.i18next.com/translation-function/plurals)
- [TypeScript Type Safety](https://www.i18next.com/overview/typescript)
- [Multilingual LLM Prompts Research](https://arxiv.org/html/2505.15229v1)
- [Ukrainian Plural Rules (CLDR)](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)
- [langdetect Library](https://github.com/Mimino666/langdetect)
