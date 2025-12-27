---
title: "Shared Layer"
created: 2025-12-27
tags:
  - архітектура
  - shared
  - components
status: active
---

# Shared Layer

==Reusable код== для всіх [[features]] та [[pages]].

## Підпапки

| Папка | Файлів | Призначення |
|-------|--------|-------------|
| ui/ | 62 | [[shadcn]] компоненти |
| components/ | 30+ | Бізнес-компоненти |
| patterns/ | 4 | [[patterns\|Compositions]] |
| hooks/ | 9 | [[shared-hooks]] |
| tokens/ | 3 | [[токени-кольорів\|Design tokens]] |
| api/ | 29 | Axios + Generated |

## ui/ vs components/ vs patterns/

> [!tip] Розмежування
> - **ui/** — Stateless Radix (button, card)
> - **components/** — Бізнес-логіка (DataTable)
> - **patterns/** — Готові compositions

## Імпорти

```tsx
import { Button, Card } from '@/shared/ui'
import { DataTable } from '@/shared/components'
import { CardWithStatus } from '@/shared/patterns'
import { useDebounce } from '@/shared/hooks'
```

## Пов'язане

- [[shadcn]] — UI компоненти
- [[patterns]] — compositions
- [[shared-hooks]] — custom hooks
