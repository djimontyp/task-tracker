---
title: "shadcn/ui"
created: 2025-12-27
tags:
  - дизайн-система
  - shadcn
  - radix
  - components
status: active
---

# shadcn/ui

==33 компоненти== на базі Radix UI primitives.

> [!note] Конфіг
> `components.json` — style: new-york, baseColor: slate

## Категорії

| Група | Компоненти |
|-------|------------|
| Dialogs | alert-dialog, dialog, sheet |
| Inputs | input, textarea, checkbox, switch, select |
| Overlays | popover, tooltip, dropdown-menu |
| Layout | card, separator, tabs, sidebar |
| Feedback | badge, skeleton, progress, alert |

## Імпорт

```tsx
import { Button, Card, Input } from '@/shared/ui'
```

> [!warning] Не плутай
> `shared/ui/` — shadcn (stateless)
> `shared/components/` — бізнес-логіка
> `shared/patterns/` — готові [[patterns|compositions]]

## Кастомізація

Компоненти копіюються в проект → можна редагувати:

```bash
npx shadcn-ui@latest add button
# → src/shared/ui/button.tsx
```

## Стилізація

Використовують [[css-variables]]:

```tsx
// Компонент
className="bg-primary text-primary-foreground"

// CSS variable
--primary: 24.6 95% 53.1%;
```

## Пов'язане

- [[css-variables]] — HSL кольори
- [[patterns]] — composition patterns
- [[storybook]] — документація
