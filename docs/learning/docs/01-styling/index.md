# Module 01: Styling System

**Tailwind CSS + CSS Variables + Dark Mode**

---

## 🎯 Що це

**Tailwind** - utility-first CSS framework. Замість писати CSS файли → utility classes в HTML.

**CSS Variables** - динамічні кольори через `hsl(var(--primary))`. Одна змінна → весь theme.

---

## 🔄 Backend аналогія

```python
# Backend: Environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

# Frontend: CSS variables
--primary: hsl(14 82% 53%)
--background: hsl(0 0% 98%)
```

Змінюєш одну змінну → весь app оновлюється.

---

## 📂 У твоєму проекті

**CSS Variables:** `src/index.css:6-68`
```css
:root {
  --background: 0 0% 98%;  /* Light theme */
  --foreground: 0 0% 12%;
  --primary: 14 82% 53%;
}

.dark {
  --background: 0 0% 12%;  /* Dark theme */
  --foreground: 0 0% 92%;
}
```

**Tailwind Config:** `tailwind.config.js:48-107`
```js
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  }
}
```

---

## 💡 Як працює

### Utility-First Approach

```tsx
// ❌ Traditional CSS
<div className="card">...</div>

// styles.css
.card {
  padding: 1rem;
  border-radius: 0.5rem;
  background: white;
}

// ✅ Tailwind
<div className="p-4 rounded-lg bg-white">...</div>
```

**Переваги:**
- ✅ No CSS files (все в JSX)
- ✅ No naming (немає ".card-big" vs ".card-large")
- ✅ Tree-shaking (unused utilities видаляються)

### Responsive Design

```tsx
// Mobile: full width, Desktop: 1/3 width
<div className="w-full md:w-1/3">...</div>

// Small text mobile, large desktop
<p className="text-sm lg:text-lg">...</p>
```

### Dark Mode

```tsx
// Light: white, Dark: dark gray
<div className="bg-white dark:bg-gray-900">...</div>
```

---

## 📊 Матриця Рішень

**Не впевнений коли використовувати Tailwind vs CSS Modules?**

👉 [**Матриця Вибору: Tailwind vs CSS Modules**](../decision-matrices/styling.md)

Порівняння use cases, переваг/недоліків, backend аналогій та реальних прикладів з проєкту.

---

## 🚫 Типові Помилки

### 1. Зловживання Inline Styles

```tsx
// ❌ НЕ РОБИ: Inline styles гублять переваги Tailwind
<div style={{ padding: '16px', backgroundColor: '#fff' }}>
  Content
</div>

// ✅ РОБИ: Використовуй Tailwind utilities
<div className="p-4 bg-white">
  Content
</div>
```

**Чому:** Inline styles не підтримують PurgeCSS, responsive breakpoints, dark mode. Втрачаєш всі переваги Tailwind.

---

### 2. Використання !important Скрізь

```tsx
// ❌ НЕ РОБИ: !important - ознака проблем із specificity
<div className="!text-red-500 !bg-blue-500 !p-8">
  Content
</div>

// ✅ РОБИ: Структуруй CSS правильно (specificity через order)
<div className="text-red-500 bg-blue-500 p-8">
  Content
</div>
```

**Чому:** Якщо потрібен `!important` → проблема з CSS specificity. Tailwind вже має правильний порядок стилів.

**Коли `!` OK:** Тільки для override сторонніх бібліотек (Radix, shadcn/ui).

---

### 3. Фіксовані px Замість Responsive Units

```tsx
// ❌ НЕ РОБИ: Фіксовані пікселі не адаптуються
<div className="w-[800px] h-[600px]">
  Fixed size
</div>

// ✅ РОБИ: Responsive units (%, rem, vh)
<div className="w-full md:w-2/3 h-screen">
  Responsive size
</div>
```

**Чому:** Фіксовані px ламають layout на мобілці. Використовуй responsive utilities.

**Backend Аналогія:**
```python
# ❌ Hardcoded values
MAX_UPLOAD_SIZE = 10485760  # 10 MB у bytes (magic number)

# ✅ Self-documenting
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
```

---

### 4. Забуті Dark Mode Стилі

```tsx
// ❌ НЕ РОБИ: Тільки light theme
<div className="bg-white text-gray-900">
  Content
</div>

// ✅ РОБИ: Підтримка dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

**Чому:** Користувачі очікують dark mode. Tailwind має вбудований `dark:` prefix.

---

### 5. className Нечитабельний (100+ символів)

```tsx
// ❌ НЕ РОБИ: Гігантський className
<div className="relative flex flex-col items-start justify-between p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
  Content
</div>

// ✅ РОБИ: Винеси в CSS @apply або компонент
// globals.css
.card-gradient {
  @apply relative flex flex-col items-start justify-between p-6;
  @apply bg-gradient-to-br from-purple-50 to-blue-50;
  @apply dark:from-purple-900/20 dark:to-blue-900/20;
  @apply border border-purple-200 dark:border-purple-800;
  @apply rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300;
}

// Component
<div className="card-gradient">
  Content
</div>
```

**Чому:** Читабельність коду важлива. Якщо className > 80 символів → винеси в @apply.

---

## 📚 Офіційна документація

- [Tailwind Docs](https://tailwindcss.com/docs) ✅
- [Utility-First](https://tailwindcss.com/docs/utility-first) ✅
- [Dark Mode](https://tailwindcss.com/docs/dark-mode) ✅
- [Responsive](https://tailwindcss.com/docs/responsive-design) ✅

---

## 🛠️ Практика

1. Відкрий `src/index.css` - подивись CSS variables
2. Знайди компонент (Button, Card)
3. Подивись Tailwind classes: `bg-primary`, `text-foreground`
4. Спробуй змінити `--primary` color → весь app оновиться

**Estimated time:** 2-3 години

---

**Далі:** [Tailwind Basics](tailwind-basics.md) | [CSS Variables](css-variables.md)

**Повернутись до:** [Learning Home](../index.md)
