# Матриця Рішень: Стилізація

## Tailwind vs CSS Modules - що вибрати?

У проєкті використовуємо **Tailwind CSS** як основний підхід. Але важливо розуміти коли Tailwind працює найкраще, а коли може бути не найкращим вибором.

---

## 📊 Матриця Вибору

| Use Case | Рішення | Чому | Приклад |
|----------|---------|------|---------|
| **Utility-first стилі (margin, padding, flex)** | Tailwind | Швидко, без context switching | `className="flex gap-4 p-6"` |
| **Responsive design** | Tailwind | Breakpoints вбудовані | `className="hidden md:block"` |
| **shadcn/ui компоненти** | Tailwind + CVA | Варіанти через class names | `buttonVariants({ variant: "outline" })` |
| **Тема (dark/light mode)** | Tailwind | `dark:` prefix | `className="bg-white dark:bg-gray-900"` |
| **Складна анімація/keyframes** | CSS Modules або Tailwind config | Tailwind може бути verbose | `@keyframes` в globals.css |
| **Компонент з багатьма стилями (100+ рядків)** | CSS Modules | Читабельність коду | `styles.complex-component` |
| **Legacy інтеграція** | CSS Modules | Поступова міграція | `.module.css` файли |

---

## ✅ Tailwind - Коли Використовувати

### 1. Utility-First Підхід
```tsx
// ✅ ДОБРЕ: Tailwind для простих утиліт
<div className="flex items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold">Заголовок</h2>
  <Button variant="outline">Дія</Button>
</div>
```

**Переваги:**
- Не треба вигадувати імена класів
- Немає зайвого CSS в bundle (PurgeCSS видаляє невикористане)
- Швидкий розробка (не переключаєшся між файлами)

### 2. Responsive Design
```tsx
// ✅ ДОБРЕ: Вбудовані breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

**Tailwind breakpoints:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

### 3. Темізація (Dark Mode)
```tsx
// ✅ ДОБРЕ: Dark mode через class
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Контент
</div>
```

### 4. Варіанти Компонентів (CVA)
```tsx
// frontend/src/shared/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md", // base
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
```

---

## ❌ Tailwind - Коли НЕ Використовувати

### 1. Складні Анімації
```css
/* ❌ ПОГАНО: Tailwind стає verbose */
<div className="animate-[wiggle_1s_ease-in-out_infinite]">...</div>

/* ✅ ДОБРЕ: CSS Modules */
/* styles.module.css */
@keyframes complexAnimation {
  0% { transform: translateX(0) rotate(0deg); opacity: 1; }
  50% { transform: translateX(100px) rotate(180deg); opacity: 0.5; }
  100% { transform: translateX(0) rotate(360deg); opacity: 1; }
}

.animated {
  animation: complexAnimation 2s ease-in-out infinite;
}
```

### 2. Компоненти з Багатьма Стилями
```tsx
// ❌ ПОГАНО: Нечитабельно
<div className="relative flex flex-col items-start justify-between p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/50 before:to-transparent before:rounded-2xl">
  ...100+ символів className...
</div>

// ✅ ДОБРЕ: CSS Modules для складних компонентів
/* ComplexCard.module.css */
.card {
  @apply relative flex flex-col items-start justify-between p-6 rounded-2xl;
  background: linear-gradient(to bottom right, theme('colors.purple.50'), theme('colors.blue.50'));
  /* + решта стилів */
}
```

---

## 🔄 Backend Аналогії

| Backend Концепт | Frontend Еквівалент | Пояснення |
|-----------------|---------------------|-----------|
| **Utility функції** (`sorted()`, `map()`) | Tailwind utilities | Маленькі, композовані шматочки |
| **Decorator pattern** | CVA (Class Variance Authority) | Додаєш варіанти до базової функціональності |
| **Environment variables** | Tailwind theme config | Централізована конфігурація |
| **Custom functions** | CSS Modules | Коли utility недостатньо |

### Приклад:

**Backend:**
```python
# Utility (як Tailwind)
users = sorted(users, key=lambda x: x.created_at)

# Custom function (як CSS Modules)
def complex_data_transformation(data: list[dict]) -> ProcessedData:
    # Складна логіка, яку важко вкласти в lambda
    ...
```

**Frontend:**
```tsx
// Utility (Tailwind)
<div className="flex items-center gap-2">...</div>

// Custom styles (CSS Modules)
import styles from './ComplexComponent.module.css'
<div className={styles.complexLayout}>...</div>
```

---

## 🎯 Реальні Приклади з Проєкту

### Tailwind для shadcn/ui
```tsx
// frontend/src/shared/ui/button.tsx
<button
  className={cn(
    buttonVariants({ variant, size }),
    className
  )}
  {...props}
/>
```

**Чому Tailwind?**
- shadcn/ui побудований на Tailwind
- Варіанти через CVA
- Легко кастомізувати

### Tailwind для Responsive Layout
```tsx
// frontend/src/app/dashboard/layout.tsx
<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
  <aside className="hidden md:block">
    <AppSidebar />
  </aside>
  <main className="flex flex-col">{children}</main>
</div>
```

**Чому Tailwind?**
- Responsive grid без медіа-запитів
- Читабельно, декларативно

---

## 💡 Pro Tips

### 1. Використовуй @apply для повторюваних паттернів
```css
/* globals.css */
.btn-base {
  @apply inline-flex items-center justify-center rounded-md font-medium transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring;
}
```

```tsx
<button className="btn-base bg-primary text-white">Click</button>
```

### 2. Tailwind config для кастомних значень
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          // ... custom palette
        },
      },
      spacing: {
        '18': '4.5rem', // custom spacing
      },
    },
  },
}
```

### 3. cn() helper для умовних класів
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "outline" && "outline-class"
)}>
```

### 4. Breakpoints в TypeScript
```tsx
// ✅ ДОБРЕ: Використовуй Tailwind breakpoints
const sizes = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
}

<div className={sizes[breakpoint]}>...</div>
```

---

## 📚 Дивись Також

- [Модуль 01: Стилізація](/01-styling/) - Tailwind basics, shadcn/ui integration
- [Модуль 02: shadcn/ui](/02-shadcn-ui/) - CVA patterns, variants
- [Офіційна документація Tailwind](https://tailwindcss.com/docs)

---

## ❓ FAQ

**Питання:** Чи можна міксувати Tailwind і CSS Modules?

**Відповідь:** Так, але краще дотримуватись одного підходу в компоненті:
```tsx
// ✅ ДОБРЕ: Один підхід
<div className="flex gap-4">...</div>

// ⚠️ УНИКАЙ: Мікс без причини
<div className={`${styles.container} flex gap-4`}>...</div>
```

---

**Питання:** Чому в проєкті Tailwind, а не CSS-in-JS (styled-components)?

**Відповідь:**
- **Tailwind:** Compile-time (нуль runtime overhead)
- **styled-components:** Runtime CSS injection (повільніше)
- **PurgeCSS:** Tailwind видаляє невикористані стилі (менший bundle)

---

**Питання:** Як перевірити який CSS в bundle?

**Відповідь:**
```bash
# Build production
npm run build

# Перевір розмір CSS
ls -lh dist/assets/*.css
```

Tailwind з PurgeCSS → ~10-20 KB CSS для середнього проєкту.
