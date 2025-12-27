---
title: "Storybook"
created: 2025-12-27
tags:
  - storybook
  - документація
status: active
---

# Storybook

==Component library== з документацією.

> [!note] URL
> http://localhost:6006

## Команди

```bash
npm run storybook
npm run story:check
```

## Покриття

| Tier | Статус |
|------|--------|
| Shared UI | 29/34 ✅ |
| Patterns | 4/4 ✅ |

**Всього:** ==82 stories==

## CSF3 формат

```tsx
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  tags: ['autodocs']
};
```

## Пов'язане

- [[storybook-mdx]] — документація
- [[../дизайн-система/patterns]] — compositions
