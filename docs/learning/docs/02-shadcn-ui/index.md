# Module 02: Shadcn UI

**Component library philosophy + практичний розбір**

---

## 🎯 Що це

Shadcn/ui - НЕ npm бібліотека. Це колекція **copy-paste** компонентів побудованих на Radix UI + Tailwind CSS.

**Філософія:** Ти володієш кодом. Змінюєш як хочеш.

---

## 🔥 Почни тут

**[Button Deep Dive →](button-deep-dive.md)** - найдетальніший розбір твого Button компонента.

---

## 💡 Copy-Paste vs npm install

**Traditional libraries (Material UI, Ant Design):**
```bash
npm install @mui/material
import { Button } from '@mui/material'
```

- ❌ Stuck with their API
- ❌ Складно кастомізувати deeply
- ❌ Bundle size (whole library)

**Shadcn approach:**
```bash
npx shadcn add button
# Копіює button.tsx в твій src/
```

- ✅ Код у твоєму проекті
- ✅ Міняєш як хочеш
- ✅ Tree-shakeable (тільки що використовуєш)

---

## 📂 У твоєму проекті

**33 shadcn компоненти:** `src/shared/ui/*.tsx`

**Найчастіше:**
- Button, Card, Dialog, Badge
- Input, Select, Textarea
- Table, Tabs, Tooltip

**Конфігурація:** `components.json:1-20`

---

## 🚫 Типові Помилки

### 1. Неправильний Variant Button

```tsx
// ❌ НЕ РОБИ: Використання default для деструктивних дій
<Button variant="default" onClick={deleteProject}>
  Delete Project
</Button>

// ✅ РОБИ: Використовуй destructive для видалення
<Button variant="destructive" onClick={deleteProject}>
  Delete Project
</Button>
```

**Чому:** shadcn/ui має семантичні варіанти:
- `default` - primary дії (Save, Submit)
- `destructive` - видалення, небезпечні дії
- `outline` - secondary дії (Cancel)
- `ghost` - мінімальні дії (Close)

**Backend Аналогія:**
```python
# HTTP methods мають семантику
@router.delete("/projects/{id}")  # Destructive action
@router.post("/projects")         # Default action
@router.get("/projects")          # Ghost (readonly)
```

---

### 2. Пропущена Accessibility (aria-label)

```tsx
// ❌ НЕ РОБИ: Icon button без aria-label
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>

// ✅ РОБИ: Завжди aria-label для icon buttons
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

**Чому:** Screen readers не бачать іконки. `aria-label` описує що робить кнопка.

**Коли Треба:**
- Icon buttons (без тексту)
- Custom components
- Interactive елементи без label

---

### 3. Забутий asChild для Custom Elements

```tsx
// ❌ НЕ РОБИ: Button всередині Link (nested buttons - invalid HTML)
<Link to="/projects">
  <Button>View Projects</Button>
</Link>

// ✅ РОБИ: asChild делегує Button стилі до Link
<Button asChild>
  <Link to="/projects">View Projects</Link>
</Button>
```

**Чому:** `asChild` (Radix Slot) мерджить props в child element. Уникає invalid HTML (`<button><a></a></button>`).

---

### 4. Перезапис CVA Variants Inline Styles

```tsx
// ❌ НЕ РОБИ: Inline className переписує variant styles
<Button variant="outline" className="bg-red-500">
  Click Me
</Button>
// bg-red-500 конфліктує з outline variant (transparent bg)

// ✅ РОБИ: Створи новий variant у CVA
// button.tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      // ...
      "outline-red": "border-red-500 text-red-500 hover:bg-red-50",
    },
  },
})

<Button variant="outline-red">
  Click Me
</Button>
```

**Чому:** CVA (Class Variance Authority) керує варіантами. Inline className створює конфлікти.

**Коли Inline OK:** Spacing utilities (`mt-4`, `ml-2`) - не конфліктують з варіантами.

---

### 5. Не Використовуєш cn() для Умовних Класів

```tsx
// ❌ НЕ РОБИ: Manual string concatenation
<Button
  className={
    isActive
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground"
  }
>
  Toggle
</Button>

// ✅ РОБИ: Використовуй cn() helper (з lib/utils)
import { cn } from "@/lib/utils"

<Button
  className={cn(
    "base-class",
    isActive && "bg-primary text-primary-foreground",
    !isActive && "bg-secondary text-secondary-foreground"
  )}
>
  Toggle
</Button>
```

**Чому:** `cn()` (clsx + tailwind-merge) правильно мерджить Tailwind класи, уникає конфліктів.

**Backend Аналогія:**
```python
# Conditional logic з helper function
def get_status_badge(status: str) -> str:
    return {
        "pending": "badge-yellow",
        "success": "badge-green",
        "error": "badge-red",
    }.get(status, "badge-gray")
```

---

## 📚 Офіційна документація

- [Shadcn Homepage](https://ui.shadcn.com/) ✅
- [Installation: Vite](https://ui.shadcn.com/docs/installation/vite) ✅
- [Button Component](https://ui.shadcn.com/docs/components/button) ✅
- [Theming Guide](https://ui.shadcn.com/docs/theming) ✅

---

**Далі:** [Button Deep Dive](button-deep-dive.md) | [Radix Primitives](radix-primitives.md)

**Повернутись до:** [Learning Home](../index.md)
