---
title: "UI Patterns"
created: 2025-12-27
tags:
  - дизайн-система
  - patterns
status: active
---

# UI Patterns

==4 готові composition patterns==

> [!tip] Імпорт
> `import { CardWithStatus, EmptyState } from '@/shared/patterns'`

## CardWithStatus

```tsx
<CardWithStatus icon={Zap} title="OpenAI" status="connected" />
```

## EmptyState

```tsx
<EmptyState icon={Inbox} title="No messages" variant="card" />
```

## ListItemWithAvatar

```tsx
<ListItemWithAvatar avatar={{ fallback: "JD" }} title={user.name} />
```

## FormField

```tsx
<FormField label="Email" error={errors.email?.message}>
  <Input {...register('email')} />
</FormField>
```

## Пов'язане

- [[shadcn]] — базові компоненти
- [[../якість/storybook]] — документація
