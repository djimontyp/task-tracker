---
title: Frontend Mental Model
type: concept
status: active
created: 2025-12-29
tags: [frontend, architecture, react, typescript]
---

# Frontend Mental Model

> Філософія розробки UI як архітектурна дисципліна

## Core Principles

### 1. Component = Function (Microservice)

```tsx
// Mental Model
function UserProfile(inputs: Props): UI {
  // Logic
  return View;
}
```

- Clear input (Props) and output (Events)
- TypeScript as strict contract
- Component is a black box

### 2. Props Down, Events Up

```tsx
// ❌ Bad: Child modifies parent state
<Button onClick={() => user.name = 'New'} />

// ✅ Good: Child requests change
<Button onClick={() => onNameChange('New')} />
```

**Аналогія:** Не лізеш в базу іншого мікросервісу - надсилаєш запит.

### 3. Composition > Inheritance

**Правило Матрьошки:**
1. **Atom**: `Button` (просто кнопка)
2. **Molecule**: `SearchForm` (Input + Button)
3. **Organism**: `Header` (Logo + SearchForm + UserProfile)

Чому надійно? `Header` не знає як працює `Button`. Якщо `Button` зламається, `Header` не впаде (Error Boundaries).

### 4. Defensive UI

```tsx
// Null check
{items?.length > 0 ? items.map(...) : <EmptyState />}

// Loading state
if (isLoading) return <Skeleton />;

// Error boundary
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

### 5. Container vs Presentational

| Type | Responsibility | Imports |
|------|---------------|---------|
| **Container** | HOW to get data | useQuery, hooks |
| **Presentational** | HOW to show data | Only Props |

## TypeScript Contract

```typescript
interface UserCardProps {
  name: string;           // Required
  avatarUrl?: string;     // Optional
  role: 'admin' | 'user'; // Enum (strict values)
  onDelete: (id: string) => void; // Callback
}
```

TS видасть помилку компіляції *до* запуску коду.

## Links

- [[entity-hierarchy]] - Business domain hierarchy
- [[design-tokens]] - Visual consistency
- [[state-management]] - Data flow patterns
