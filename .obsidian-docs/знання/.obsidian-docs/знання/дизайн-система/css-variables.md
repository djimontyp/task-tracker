---
title: "CSS Variables"
created: 2025-12-27
tags:
  - дизайн-система
  - css
status: active
---

# CSS Variables

==HSL формат== для light/dark switching.

> [!note] Файл
> `src/index.css`

## Light Mode

```css
--background: 0 0% 100%;
--primary: 24.6 95% 53.1%;
--semantic-success: 142 76% 36%;
```

## Dark Mode

```css
.dark {
  --background: 20 14.3% 4.1%;
  --semantic-success: 142 71% 59%;
}
```

## Пов'язане

- [[токени-кольорів]] — TypeScript обгортки
- [[shadcn]] — компоненти
