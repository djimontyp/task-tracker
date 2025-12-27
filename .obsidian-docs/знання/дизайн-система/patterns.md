---
title: "UI Patterns"
created: 2025-12-27
tags:
  - дизайн-система
  - patterns
  - components
status: active
---

# UI Patterns

==4 готові composition patterns== — замість ручної Tailwind композиції.

> [!tip] Імпорт
> `import { CardWithStatus, EmptyState } from '@/shared/patterns'`

## CardWithStatus

Картка з іконкою та [[статуси|статусом]]:

```tsx
<CardWithStatus
  icon={Zap}
  title="OpenAI"
  status="connected"  // connected | validating | pending | error
  statusLabel="Active"
/>
```

**Допоміжні:**
- `<StatusBadge status="validating" label="..." />`
- `<StatusDot status="connected" pulse />`

## EmptyState

Порожній список з ==call-to-action==:

```tsx
<EmptyState
  icon={Inbox}
  title="No messages"
  description="Messages will appear here"
  action={<Button>Add</Button>}
  variant="default"  // default | card | compact | inline
/>
```

## ListItemWithAvatar

```tsx
<ListItemWithAvatar
  avatar={{ src: user.avatar, fallback: "JD" }}
  avatarSize="md"  // sm | md | lg | xl
  title={user.name}
  subtitle={user.email}
/>
```

## FormField

[[форми|Форма]] з валідацією:

```tsx
<FormField
  label="Email"
  required
  error={errors.email?.message}
>
  <Input {...register('email')} />
</FormField>
```

## Файли

| Pattern | Файл |
|---------|------|
| CardWithStatus | `shared/patterns/CardWithStatus.tsx` |
| EmptyState | `shared/patterns/EmptyState.tsx` |
| ListItemWithAvatar | `shared/patterns/ListItemWithAvatar.tsx` |
| FormField | `shared/patterns/FormField.tsx` |

## Пов'язане

- [[storybook]] — Design System / Patterns
- [[токени-кольорів]] — semantic colors
- [[shadcn]] — базові компоненти
