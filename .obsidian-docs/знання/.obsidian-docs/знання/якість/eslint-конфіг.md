---
title: "ESLint конфіг"
created: 2025-12-27
tags:
  - eslint
  - якість
status: active
---

# ESLint конфіг

==Конфігурація== linting для frontend.

> [!note] Файл
> `.eslintrc.cjs`

## Extends

```
eslint:recommended
plugin:@typescript-eslint/recommended
plugin:react-hooks/recommended
```

## Команди

```bash
npm run lint       # Перевірка
npm run lint:fix   # Auto-fix
```

## Пов'язане

- [[eslint-правила]] — local rules
- [[pre-commit]] — автоматична перевірка
