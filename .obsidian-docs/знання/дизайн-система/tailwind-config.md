---
title: "Tailwind Config"
created: 2025-12-27
tags:
  - дизайн-система
  - tailwind
  - responsive
status: active
---

# Tailwind Config

==Breakpoints, fonts, shadows== — кастомізація Tailwind.

> [!note] Файл
> `tailwind.config.ts`

## Breakpoints

| Name | Width | Використання |
|------|-------|--------------|
| `xs:` | 375px | Малі телефони |
| `sm:` | 640px | Телефони |
| `md:` | 768px | Планшети |
| `lg:` | 1024px | ==Ноутбуки (default)== |
| `xl:` | 1280px | Десктопи |
| `2xl:` | 1536px | Великі |
| `3xl:` | 1920px | Full HD |

## Mobile-first

```tsx
// Base = mobile, потім розширюємо
<div className="p-4 md:p-6 lg:p-8">
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## Кастомні токени

| Група | Значення |
|-------|----------|
| Font | Raleway |
| Radius | lg=8px, md=6px, sm=4px |
| Shadows | glow, glow-hover |
| Animations | fade-in, fade-in-up, spin-slow |

## Glow ефект

```tsx
className="shadow-glow hover:shadow-glow-hover"
```

## Пов'язане

- [[css-variables]] — кольори
- [[токени-spacing]] — spacing система
- [[storybook]] — responsive preview
