---
title: "CSS Variables"
created: 2025-12-27
tags:
  - дизайн-система
  - css
  - dark-mode
status: active
---

# CSS Variables

==HSL формат== для light/dark mode switching в [[shadcn]].

> [!note] Файл
> `src/index.css` — всі визначення

## Light Mode (base)

```css
--background: 0 0% 100%;
--foreground: 20 14.3% 4.1%;
--primary: 24.6 95% 53.1%;      /* оранжевий */
--accent: 38 51% 50%;           /* золотистий */
```

## Dark Mode

```css
.dark {
  --background: 20 14.3% 4.1%;
  --foreground: 60 9.1% 97.8%;
}
```

> [!tip] Контраст
> Dark mode кольори ==світліші== для WCAG контрасту

## Семантичні

| Variable | Light | Dark |
|----------|-------|------|
| `--semantic-success` | 142 76% 36% | 142 71% 59% |
| `--semantic-error` | 0 84% 60% | 0 78% 65% |
| `--status-connected` | 142 71% 45% | — |

## Використання

```tsx
// Tailwind автоматично
className="bg-primary text-foreground"

// CSS напряму (рідко)
style={{ color: 'hsl(var(--primary))' }}
```

## Пов'язане

- [[токени-кольорів]] — TypeScript обгортки
- [[shadcn]] — компоненти що використовують
- [[wcag]] — контраст вимоги
