---
title: "Storybook MDX"
created: 2025-12-27
tags:
  - storybook
  - mdx
  - документація
status: active
---

# Storybook MDX

==6 MDX файлів== з документацією [[дизайн-система|Design System]].

## Файли

| MDX | Зміст |
|-----|-------|
| Introduction.mdx | Огляд Storybook |
| Colors.mdx | [[токени-кольорів\|Semantic colors]] |
| Spacing.mdx | [[токени-spacing\|Grid, padding, gap]] |
| Tokens.mdx | TypeScript система |
| Accessibility.mdx | [[wcag\|WCAG guidelines]] |
| ComponentHierarchy.mdx | Навігація |

## Локація

```
src/docs/
├── Introduction.mdx
├── Colors.mdx
├── Spacing.mdx
└── ...
```

## Формат

```mdx
import { Meta, ColorPalette } from '@storybook/blocks';

<Meta title="Design System/Colors" />

# Colors

Semantic color tokens...

<ColorPalette>
  <ColorItem title="semantic.success" colors={['#22c55e']} />
</ColorPalette>
```

## Пов'язане

- [[storybook]] — конфіг
- [[токени-кольорів]] — Colors.mdx
- [[wcag]] — Accessibility.mdx
