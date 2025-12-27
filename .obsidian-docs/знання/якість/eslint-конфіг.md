---
title: "ESLint конфіг"
created: 2025-12-27
tags:
  - eslint
  - якість-коду
  - config
status: active
---

# ESLint конфіг

==Конфігурація== linting для [[архітектура|frontend]].

> [!note] Файл
> `.eslintrc.cjs`

## Extends

```
eslint:recommended
plugin:@typescript-eslint/recommended
plugin:react/recommended
plugin:react-hooks/recommended
plugin:storybook/recommended
```

## Plugins

| Plugin | Призначення |
|--------|-------------|
| `@typescript-eslint` | TypeScript rules |
| `react-hooks` | Hooks validation |
| `local-rules` | [[eslint-правила\|Design System rules]] |

## Команди

```bash
npm run lint         # Перевірка
npm run lint:fix     # Auto-fix
npm run lint:strict  # 0 warnings (CI)
```

## Пов'язане

- [[eslint-правила]] — local rules
- [[pre-commit]] — автоматична перевірка
- [[storybook]] — storybook/recommended
