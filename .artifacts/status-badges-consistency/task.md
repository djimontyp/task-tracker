# Завдання: Консистентна система status badges

## Мета
Створити централізовану систему для маппінгу статусів на badge варіанти, щоб забезпечити візуальну консистентність по всьому додатку.

## Технічні вимоги

### 1. Аудит поточного стану
- Проаналізувати `/frontend/src/shared/ui/badge.tsx` - які варіанти є зараз
- Знайти всі використання `<Badge>` компонента
- Виявити які статуси використовуються в:
  - MessagesPage columns
  - TopicsPage columns  
  - ProposalsPage columns
  - AnalysisRunsPage columns

### 2. Розширити badgeVariants (якщо потрібно)
- Переконатись що є варіанти: `default`, `secondary`, `destructive`, `outline`, `success`
- Додати якщо відсутні: `warning`, `info`

### 3. Створити централізований маппінг
**Файл:** `/frontend/src/shared/constants/statusBadges.ts`

```typescript
// Маппінг статусів на badge варіанти для консистентності UI
export const STATUS_VARIANTS = {
  // Messages
  analyzed: 'success',
  pending: 'warning',
  // Proposals
  approved: 'success',
  rejected: 'destructive',
  // Analysis
  open: 'info',
  closed: 'secondary',
  failed: 'destructive',
} as const

export type StatusKey = keyof typeof STATUS_VARIANTS
export type BadgeVariant = typeof STATUS_VARIANTS[StatusKey]
```

### 4. Рефакторинг columns.tsx файлів
- Замінити hardcoded варіанти на `STATUS_VARIANTS[status]`
- Додати імпорти з `@/shared/constants/statusBadges`
- Забезпечити type safety

## Acceptance Criteria
✅ Файл `/frontend/src/shared/constants/statusBadges.ts` створено
✅ Всі статуси мають консистентні кольори
✅ Всі columns.tsx використовують STATUS_VARIANTS
✅ TypeScript компіляція проходить без помилок
✅ Візуальна консистентність перевірена (якщо доступний Playwright)

## Очікуваний звіт
Стислий список:
- Які файли змінено
- Які статуси додано до маппінгу
- Чи потрібно було розширювати badgeVariants
