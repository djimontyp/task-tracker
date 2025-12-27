# Quickstart: i18n Implementation

**Feature Branch**: `005-i18n`
**Estimated Complexity**: Medium (3-5 days)

## Prerequisites

- Node.js 18+
- Python 3.12+
- Docker Compose running (`just services-dev`)
- Frontend dev server running

## Quick Setup

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install i18next react-i18next i18next-http-backend

# Backend
cd ../backend
pip install langdetect
```

### 2. Create i18n Configuration

**File:** `frontend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uk',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'messages', 'atoms', 'topics', 'settings', 'errors'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
```

### 3. Create Translation Files

**File:** `frontend/public/locales/uk/common.json`

```json
{
  "actions": {
    "save": "Зберегти",
    "cancel": "Скасувати",
    "delete": "Видалити",
    "edit": "Редагувати",
    "create": "Створити"
  },
  "navigation": {
    "dashboard": "Дашборд",
    "messages": "Повідомлення",
    "topics": "Теми",
    "settings": "Налаштування"
  }
}
```

**File:** `frontend/public/locales/en/common.json`

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "messages": "Messages",
    "topics": "Topics",
    "settings": "Settings"
  }
}
```

### 4. Add Language to Zustand Store

**File:** `frontend/src/shared/store/uiStore.ts` (modify)

```typescript
interface UiStore {
  // ... existing fields
  language: 'uk' | 'en';
  setLanguage: (lang: 'uk' | 'en') => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      // ... existing state
      language: 'uk',
      setLanguage: (lang) => {
        import('i18next').then(({ default: i18n }) => {
          i18n.changeLanguage(lang);
        });
        set({ language: lang });
      },
    }),
    {
      name: 'ui-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        // ... other persisted fields
      })
    }
  )
);
```

### 5. Initialize i18n in App

**File:** `frontend/src/main.tsx` (modify)

```typescript
import './i18n/config';
// ... rest of imports

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 6. Add Language Selector to Settings

**File:** `frontend/src/pages/SettingsPage/components/GeneralTab.tsx` (modify)

```typescript
import { useTranslation } from 'react-i18next';

const languageOptions = [
  { value: 'uk' as const, label: 'Українська' },
  { value: 'en' as const, label: 'English' },
];

const GeneralTab = () => {
  const { t } = useTranslation('settings');
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  return (
    <div className="space-y-6">
      {/* Language Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('general.language.title')}</CardTitle>
          <CardDescription>{t('general.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={language} onValueChange={setLanguage}>
            {languageOptions.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`language-${value}`} />
                <Label htmlFor={`language-${value}`}>{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ... existing cards */}
    </div>
  );
};
```

### 7. Use Translations in Components

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation(['common', 'atoms']);

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('actions.save')}</button>
      <span>{t('atoms:type.task')}</span>
    </div>
  );
};
```

---

## Backend Setup

### 1. Add Migration

```bash
cd backend
alembic revision --autogenerate -m "add i18n fields"
alembic upgrade head
```

### 2. Update User Model

**File:** `backend/app/models/user.py` (modify)

```python
class User(IDMixin, TimestampMixin, SQLModel, table=True):
    # ... existing fields

    ui_language: str = Field(
        default="uk",
        max_length=10,
        description="UI language preference"
    )
```

### 3. Update User Schema

**File:** `backend/app/schemas/users.py` (modify)

```python
class UserResponse(BaseModel):
    # ... existing fields
    ui_language: str

class UserUpdateRequest(BaseModel):
    # ... existing fields
    ui_language: str | None = None
```

### 4. Add Language Validation

```python
from langdetect import detect

def validate_ai_output_language(text: str, expected: str) -> bool:
    try:
        detected = detect(text)
        return detected == expected
    except:
        return False
```

---

## Verification Checklist

- [ ] Language selector appears in Settings > General
- [ ] Selecting language switches UI instantly (<100ms)
- [ ] Language persists on page reload (localStorage)
- [ ] Backend accepts language update via PATCH /api/v1/users/me
- [ ] AI prompts use project.language for content generation
- [ ] TypeScript shows autocomplete for translation keys
- [ ] Ukrainian pluralization works (1 повідомлення, 2 повідомлення, 5 повідомлень)

---

## Common Issues

### Issue: Translations not loading

Check that:
1. Files exist in `public/locales/{lang}/{namespace}.json`
2. Backend serves static files correctly
3. i18n config has correct `loadPath`

### Issue: Instant switch not working

Ensure:
1. `useSuspense: false` in i18n config
2. `i18n.changeLanguage()` called in Zustand action
3. Components use `useTranslation()` hook

### Issue: TypeScript errors for translation keys

1. Ensure `src/i18n/types.ts` exists with module augmentation
2. Run `npx tsc --noEmit` to verify
3. Restart TypeScript server in IDE

---

## Next Steps

1. Add translations for all namespaces
2. Implement backend language persistence
3. Add language detection for AI output
4. Create prompt variants for agents
