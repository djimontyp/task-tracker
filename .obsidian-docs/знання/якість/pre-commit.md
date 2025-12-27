---
title: "Pre-commit Hook"
created: 2025-12-27
tags:
  - eslint
  - git
  - husky
  - automation
status: active
---

# Pre-commit Hook

==Автоматична перевірка== перед кожним commit.

> [!warning] Блокує commit
> ESLint errors, TypeScript errors, missing stories

## Конфіг

**Husky:** `.husky/pre-commit`

```bash
cd frontend
npx lint-staged
```

**lint-staged:** `package.json`

```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "bash -c 'tsc --noEmit'"
  ],
  "src/shared/**/*.tsx": [
    "npx tsx scripts/check-story-coverage.ts --staged-only"
  ]
}
```

## Що перевіряє

| Перевірка | Результат |
|-----------|-----------|
| [[eslint-правила\|ESLint rules]] | ==Блокує== |
| TypeScript | ==Блокує== |
| Story coverage (shared/) | ==Блокує== |

## Обхід (emergency)

```bash
git commit --no-verify -m "Emergency fix"
```

> [!danger] Тільки надзвичайні випадки
> Потім виправ і закоміть нормально

## Приклад блокування

```bash
$ git commit -m "Add badge"

✖ eslint --fix --max-warnings 0:
  12:14  error  ❌ Raw Tailwind color "bg-green-500"

husky - pre-commit script failed (code 1)
```

## Пов'язане

- [[eslint-правила]] — що перевіряється
- [[storybook]] — story coverage
- [[typescript-конфіг]] — type checking
