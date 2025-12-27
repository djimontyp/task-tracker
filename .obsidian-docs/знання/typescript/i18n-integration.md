---
type: knowledge
created: 2025-12-27
tags:
  - i18n
  - react
  - typescript
  - patterns
---

# i18n Integration Pattern

Паттерн інтеграції react-i18next в React компоненти.

## Базовий паттерн

```tsx
import { useTranslation } from 'react-i18next';

export function Component() {
  const { t } = useTranslation('namespace');
  return <h1>{t('key')}</h1>;
}
```

## Множинні namespaces

```tsx
const { t } = useTranslation(['primary', 'fallback']);

// Явна вказівка namespace
t('primary:key');
t('fallback:another');
```

## Fallback значення

```tsx
// Якщо ключ відсутній — покаже fallback
t('missing.key', 'Default value');
```

## Інтерполяція

```tsx
t('greeting', { name: 'User' });
// greeting: "Привіт, {{name}}!"
```

## Плюралізація (українська)

```json
{
  "atom_one": "{{count}} атом",
  "atom_few": "{{count}} атоми",
  "atom_many": "{{count}} атомів"
}
```

```tsx
t('atom', { count: 5 }); // "5 атомів"
```

## Структура файлів

```
public/locales/
├── uk/
│   ├── common.json     # shared
│   ├── dashboard.json
│   ├── messages.json
│   ├── topics.json
│   ├── atoms.json
│   └── settings.json
└── en/
    └── ... (аналогічно)
```

## Wikilinks

- [[typescript/react-hooks]]
- [[архітектура/frontend-layers]]
