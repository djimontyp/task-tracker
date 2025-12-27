---
title: "Pre-commit Hook"
created: 2025-12-27
tags:
  - eslint
  - git
status: active
---

# Pre-commit Hook

==Автоматична перевірка== перед commit.

> [!warning] Блокує commit
> ESLint errors, TypeScript errors

## lint-staged

```json
"*.{ts,tsx}": [
  "eslint --fix --max-warnings 0",
  "bash -c 'tsc --noEmit'"
]
```

## Обхід (emergency)

```bash
git commit --no-verify -m "fix"
```

## Пов'язане

- [[eslint-правила]] — що перевіряється
- [[storybook]] — story coverage
