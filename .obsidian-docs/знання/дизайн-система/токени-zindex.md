---
title: "Z-index токени"
created: 2025-12-27
updated: 2025-12-27
tags:
  - дизайн-система
  - токени
  - z-index
status: active
---

# Z-index токени

Централізована система z-index для уникнення конфліктів шарів.

## Шкала

| Token | Value | Tailwind | Використання |
|-------|-------|----------|--------------|
| `base` | 0 | `z-base` | Default content |
| `dropdown` | 10 | `z-dropdown` | Dropdowns, selects |
| `sticky` | 20 | `z-sticky` | Sticky headers |
| `fixed` | 30 | `z-fixed` | Fixed navigation |
| `modalBackdrop` | 40 | `z-modal-backdrop` | Modal overlays |
| `modal` | 50 | `z-modal` | Dialogs, sheets |
| `popover` | 60 | `z-popover` | Popovers, menus |
| `tooltip` | 70 | `z-tooltip` | Tooltips |
| `toast` | 80 | `z-toast` | Notifications |
| `max` | 9999 | `z-max` | Emergency override |

## Файли

- `frontend/src/shared/tokens/zindex.ts` — TypeScript токени
- `frontend/tailwind.config.js` — Tailwind extend

## Використання

### Tailwind (рекомендовано)

```tsx
<div className="z-modal">Modal content</div>
<div className="z-tooltip">Tooltip</div>
<div className="z-dropdown">Dropdown menu</div>
```

### TypeScript

```tsx
import { zIndex, zIndexClasses } from '@/shared/tokens';

// Inline style
style={{ zIndex: zIndex.modal }}

// Class name
className={zIndexClasses.popover}
```

## Компоненти що використовують

| Компонент | Token |
|-----------|-------|
| `dialog.tsx` | `z-modal-backdrop`, `z-modal` |
| `alert-dialog.tsx` | `z-modal-backdrop`, `z-modal` |
| `sheet.tsx` | `z-modal-backdrop`, `z-modal` |
| `tooltip.tsx` | `z-tooltip` |
| `popover.tsx` | `z-popover` |
| `dropdown-menu.tsx` | `z-popover` |
| `select.tsx` | `z-popover` |
| `sidebar.tsx` | `z-dropdown`, `z-sticky` |

## Заборонено

```tsx
// ❌ Raw z-index
className="z-50"
style={{ zIndex: 100 }}

// ✅ Semantic tokens
className="z-modal"
className={zIndexClasses.modal}
```

## Пов'язане

- [[токени-кольорів]]
- [[токени-spacing]]
- [[eslint-правила]]
