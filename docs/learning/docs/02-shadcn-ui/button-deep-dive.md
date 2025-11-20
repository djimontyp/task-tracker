# 🔥 Button Component: Deep Dive

**Найдетальніший розбір компонента з твого проекту**

Цей модуль показує повний аналіз реального компонента - від проблем до рішень. Використовуй як шаблон для розуміння інших компонентів.

---

## 🎯 Що будемо аналізувати

**Файл:** `src/shared/ui/button.tsx` (65 lines)

**Що всередині:**
- CVA (Class Variance Authority) для variants
- Radix Slot для asChild pattern
- Loading state з іконкою
- 6 variants: default, destructive, outline, secondary, ghost, link
- 4 sizes: default, sm, lg, icon

**Проблема:** Over-engineering зі складними градієнтами та тінями вбудованими в компонент.

**Shadcn підхід:** Мінімальні стилі, customization через className при використанні.

---

## 📂 Твій код зараз

**Файл:** `src/shared/ui/button.tsx:1-65`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { cn } from "@/shared/lib/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-accent/30 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:border-accent hover:shadow-[0_0_12px_rgba(244,133,73,0.4)] active:scale-[0.98] disabled:from-primary/40 disabled:to-accent/40 disabled:border-transparent disabled:shadow-none",
        destructive:
          "border border-destructive/40 bg-gradient-to-r from-destructive via-destructive to-[hsl(353,84%,38%)] text-destructive-foreground hover:border-destructive hover:shadow-[0_0_8px_rgba(215,38,56,0.5)] active:scale-[0.98] disabled:from-destructive/40 disabled:to-destructive/40 disabled:border-transparent disabled:shadow-none",
        outline:
          "border border-border/60 bg-background text-foreground hover:bg-accent/10 hover:border-accent/50 hover:text-accent-foreground active:scale-[0.98] disabled:bg-background/50 disabled:text-muted-foreground disabled:border-border/30",
        secondary:
          "border border-[hsl(17,45%55%)] bg-secondary text-secondary-foreground hover:border-[hsl(17,50%,60%)] hover:shadow-[0_0_8px_rgba(201,126,99,0.3)] active:scale-[0.98] disabled:bg-secondary/40 disabled:border-transparent disabled:shadow-none",
        ghost:
          "border border-border/50 bg-gradient-to-b from-background to-muted/20 text-foreground hover:border-accent/40 hover:from-accent/5 hover:to-accent/10 active:scale-[0.98] aria-pressed:border-primary aria-pressed:from-primary aria-pressed:to-accent aria-pressed:text-primary-foreground aria-pressed:shadow-[0_0_8px_rgba(244,133,73,0.3)] disabled:from-transparent disabled:to-transparent disabled:text-muted-foreground disabled:border-border/25",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline active:text-primary/80 disabled:no-underline disabled:text-primary/50",
      },
      size: {
        default: "h-10 md:h-11 px-4 text-sm",
        sm: "h-9 md:h-10 px-3 text-xs",
        lg: "h-11 md:h-12 px-5 text-sm",
        icon: "h-10 w-10 md:h-11 md:w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <ArrowPathIcon className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## ❌ Що не так з цим кодом?

### 1. Over-Engineering з градієнтами

```tsx
// ❌ Твій default variant
default: "border border-accent/30 bg-gradient-to-r from-primary to-accent ..."
```

**Проблеми:**
- Градієнт вбудований - складно override
- Якщо треба solid колір кнопка → доведеться !important або новий variant
- Кастомна тінь `shadow-[0_0_12px_rgba(...)]` - неможливо змінити через className
- `active:scale-[0.98]` - анімація вбудована (не всім потрібна)

**Shadcn підхід:**
```tsx
// ✅ Shadcn default variant
default: "bg-primary text-primary-foreground hover:bg-primary/90"
```

Просто. Якщо треба градієнт - додаєш при використанні:
```tsx
<Button className="bg-gradient-to-r from-blue-500 to-purple-500">
  Custom gradient
</Button>
```

---

### 2. Складні disabled states

```tsx
// ❌ Твій код
disabled:from-primary/40 disabled:to-accent/40 disabled:border-transparent disabled:shadow-none
```

**4 класи** тільки для disabled state одного варіанта!

**Shadcn підхід:**
```tsx
// ✅ Base disabled в baseClasses
disabled:pointer-events-none disabled:opacity-50
```

Один universal disabled state для всіх варіантів.

---

### 3. Custom тіні всюди

```tsx
hover:shadow-[0_0_12px_rgba(244,133,73,0.4)]
hover:shadow-[0_0_8px_rgba(215,38,56,0.5)]
hover:shadow-[0_0_8px_rgba(201,126,99,0.3)]
```

**Проблема:** Hardcoded rgba values. Що якщо змінити колір theme? Тіні не адаптуються.

**Краще:** Використовувати Tailwind utilities (`shadow-sm`, `shadow-md`) або CSS variables.

---

## ✅ Shadcn підхід: Simple & Flexible

**Як виглядає стандартний shadcn Button:**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Різниця:**
- ✅ Solid colors, не градієнти
- ✅ Simple hover states (`/90`, `/80`)
- ✅ No custom shadows
- ✅ No scale animations
- ✅ Customization через className

---

## 💡 CVA (Class Variance Authority) Deep Dive

### Чому не if/else?

**Без CVA:**
```tsx
// ❌ Imperative approach
function Button({ variant, size }) {
  let classes = "base-button"

  if (variant === "default") classes += " bg-primary text-white"
  if (variant === "destructive") classes += " bg-red text-white"

  if (size === "sm") classes += " h-8 px-2"
  if (size === "lg") classes += " h-12 px-6"

  return <button className={classes}>...</button>
}
```

**Проблеми:**
- ❌ String concatenation (easy to miss space)
- ❌ No TypeScript safety (variant="typo" компілюється)
- ❌ Складно додати compound variants

**З CVA:**
```tsx
// ✅ Declarative approach
const buttonVariants = cva("base-button", {
  variants: {
    variant: {
      default: "bg-primary text-white",
      destructive: "bg-red text-white",
    },
    size: {
      sm: "h-8 px-2",
      lg: "h-12 px-6",
    },
  },
})

<button className={buttonVariants({ variant, size })}>
```

**Переваги:**
- ✅ TypeScript знає які variants існують
- ✅ Декларативно (бачиш всі варіанти одразу)
- ✅ Підтримка compound variants (якщо variant="default" + size="lg" → особливі стилі)

---

### Compound Variants (Advanced)

**Коли потрібно:**

```tsx
const buttonVariants = cva("base", {
  variants: {
    variant: { default: "bg-blue", destructive: "bg-red" },
    size: { sm: "text-sm", lg: "text-lg" },
  },
  compoundVariants: [
    {
      variant: "default",
      size: "lg",
      class: "font-bold shadow-lg", // Тільки для default + lg
    },
  ],
})
```

**Використання у твоєму проекті:**

В твоєму Button немає compound variants, але ти можеш додати:

```tsx
compoundVariants: [
  {
    variant: "default",
    size: "icon",
    class: "rounded-full", // Icon buttons круглі
  },
]
```

---

## 🔄 Radix Slot Pattern

### Що таке `asChild` prop?

**У твоєму коді:**
```tsx
const Comp = asChild ? Slot : "button"
return <Comp {...props}>{children}</Comp>
```

**Навіщо:**

```tsx
// Без asChild - вкладений button (invalid HTML)
<Button>
  <Link to="/home">
    <button>Home</button> {/* ❌ button в button */}
  </Link>
</Button>

// З asChild - Slot передає props на Link
<Button asChild>
  <Link to="/home">Home</Link> {/* ✅ стилі Button на Link */}
</Button>
```

**Результат HTML:**
```html
<!-- З asChild рендериться як: -->
<a href="/home" class="inline-flex items-center...">Home</a>
```

**Коли використовувати:**
- Кнопка як Link (`<Button asChild><Link /></Button>`)
- Кнопка як Next.js Link
- Будь-який custom елемент з Button стилями

---

## 🛠️ Практичний рефакторинг

### Завдання: Спрости default variant

**До (твій код):**
```tsx
default:
  "border border-accent/30 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:border-accent hover:shadow-[0_0_12px_rgba(244,133,73,0.4)] active:scale-[0.98] disabled:from-primary/40 disabled:to-accent/40 disabled:border-transparent disabled:shadow-none"
```

**Після (shadcn approach):**
```tsx
default:
  "bg-primary text-primary-foreground hover:bg-primary/90"
```

**Чому краще:**
- ✅ Легко читати
- ✅ Легко override (`<Button className="bg-blue-500">`)
- ✅ Працює з будь-якою темою (використовує CSS variables)
- ✅ No hardcoded colors

---

### Як це зробити:

#### Крок 1: Знайди buttonVariants

**Файл:** `src/shared/ui/button.tsx:8-36`

#### Крок 2: Замість default variant

**Було:**
```tsx
default: "border border-accent/30 bg-gradient-to-r from-primary to-accent..."
```

**Стане:**
```tsx
default: "bg-primary text-primary-foreground hover:bg-primary/90"
```

#### Крок 3: Перевір візуально

```bash
just services-dev
# Відкрий http://localhost/dashboard
# Подивись на кнопки
```

#### Крок 4: Якщо треба градієнт в конкретному місці

```tsx
// Тепер додаєш при використанні
<Button className="bg-gradient-to-r from-primary to-accent">
  Fancy Button
</Button>
```

---

## 🔍 Loading State Implementation

**У твоєму коді:**
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading = false, children, disabled, ...props }, ref) => {
    return (
      <Comp
        disabled={disabled || loading}  // Disabled коли loading
        {...props}
      >
        {loading && <ArrowPathIcon className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
```

**Як працює:**
1. `loading` prop → додається спінер іконка
2. Button стає disabled автоматично
3. `animate-spin` - Tailwind utility (360° rotation loop)

**Використання:**
```tsx
const [isLoading, setIsLoading] = useState(false)

<Button
  loading={isLoading}
  onClick={async () => {
    setIsLoading(true)
    await api.createProject()
    setIsLoading(false)
  }}
>
  Create Project
</Button>
```

**Trade-offs:**
- ✅ Зручно (не треба вручну додавати spinner)
- ❌ Іконка завжди ArrowPathIcon (не можна змінити)
- ❌ Disabled автоматично (іноді треба loading без disabled)

**Shadcn підхід:**

Shadcn не має вбудованого loading state. Додаєш вручну:

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Create Project
</Button>
```

**Чому:**
- ✅ Більше контролю (можна інший спінер)
- ✅ Можна показати text під час loading
- ✅ Можна НЕ робити disabled

---

## 🎨 Accessibility (a11y)

**У твоєму base класах:**
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**Що це робить:**

### focus-visible vs focus

```tsx
// ❌ Погано - focus завжди
button:focus { outline: 2px solid blue; }

// ✅ Добре - focus тільки з клавіатури
button:focus-visible { outline: 2px solid blue; }
```

**focus-visible** показує outline тільки коли користувач navigate keyboard (Tab key), не при mouse click.

### Ring pattern

**Tailwind ring utilities:**
- `ring-2` - 2px ring
- `ring-ring` - колір з CSS variable `--ring`
- `ring-offset-2` - 2px відступ між button і ring

**Візуально:**
```
┌─────────────┐
│   Button    │ ← ring-offset-2
│             │
└─────────────┘
  ▔▔▔▔▔▔▔▔▔▔▔ ← ring-2 (blue)
```

**Чому важливо:**
- ✅ Keyboard users бачать на якій кнопці фокус
- ✅ WCAG 2.1 AA compliance (accessibility standard)

---

## 📚 Офіційна документація

**Shadcn/ui:**
- [Button Component](https://ui.shadcn.com/docs/components/button) - Офіційна документація Button
- [Installation: Vite](https://ui.shadcn.com/docs/installation/vite) - Як додавати компоненти
- [Theming Guide](https://ui.shadcn.com/docs/theming) - CSS variables approach

**CVA (Class Variance Authority):**
- [CVA Official Docs](https://cva.style/docs) - Повна документація
- [Getting Started](https://cva.style/docs/getting-started) - Базові приклади
- [GitHub](https://github.com/joe-bell/cva) - Repo з examples

**Radix UI:**
- [Slot Utility](https://www.radix-ui.com/primitives/docs/utilities/slot) - asChild pattern explained
- [Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) - WAI-ARIA implementation

**Tailwind CSS:**
- [Customizing Colors](https://tailwindcss.com/docs/customizing-colors) - CSS variables approach
- [Dark Mode](https://tailwindcss.com/docs/dark-mode) - dark: prefix
- [Responsive Design](https://tailwindcss.com/docs/responsive-design) - md: lg: prefixes

---

## 🔄 Backend аналогія

**Button variants = FastAPI dependencies**

```python
# Backend: Different auth strategies
def get_admin_user(token: str = Depends(oauth2_scheme)):
    # Admin-only logic
    pass

def get_regular_user(token: str = Depends(oauth2_scheme)):
    # Regular user logic
    pass

# Використання
@app.get("/admin")
def admin_endpoint(user = Depends(get_admin_user)):
    pass

@app.get("/dashboard")
def dashboard(user = Depends(get_regular_user)):
    pass
```

**Frontend: Button variants**

```tsx
// Frontend: Different button styles
<Button variant="default">Create</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
```

**Спільне:**
- ✅ Декларативний вибір behavior/styles
- ✅ Type safety (TypeScript знає variants, Python знає dependencies)
- ✅ Reusable patterns

---

## ❓ FAQ

### Q: Чому shadcn не використовує градієнти?

**A:** Flexibility over fancy. Градієнт виглядає гарно, але:
- Складно кастомізувати
- Не всім проектам потрібні
- Можна додати через className коли потрібно

Shadcn дає мінімум → ти додаєш що потрібно.

---

### Q: Чи можна залишити мої градієнти?

**A:** Так! Але розумій trade-offs:
- ✅ Consistent look across app (всі кнопки fancy)
- ❌ Важче override (треба !important або новий variant)
- ❌ Більше коду (disabled states для кожного gradient)

**Рекомендація:** Якщо градієнти - core brand identity → залишай. Якщо просто "виглядає гарно" → shadcn підхід гнучкіший.

---

### Q: Що робити з існуючими Button викликами?

**A:** Після рефакторингу default variant:

```tsx
// ✅ Ці продовжують працювати
<Button>Save</Button>
<Button variant="destructive">Delete</Button>

// ✅ Якщо десь треба градієнт
<Button className="bg-gradient-to-r from-blue-500 to-purple-500">
  Special Action
</Button>
```

No breaking changes! Тільки default variant простіший.

---

### Q: Як додати новий variant?

**Легко!**

```tsx
const buttonVariants = cva("base...", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
      // Додай свій
      success: "bg-green-600 text-white hover:bg-green-700",
    },
  },
})
```

Використання:
```tsx
<Button variant="success">Saved!</Button>
```

TypeScript автоматично бачить новий variant!

---

## 🛠️ Практичне завдання

### Завдання 1: Спрости default variant

1. Відкрий `src/shared/ui/button.tsx`
2. Знайди `buttonVariants` (line 8)
3. Замість default variant напиши:
   ```tsx
   default: "bg-primary text-primary-foreground hover:bg-primary/90"
   ```
4. Збережи файл
5. Перевір в браузері (кнопки стали простішими)

**Estimated time:** 5 хвилин

---

### Завдання 2: Додай success variant

1. В `buttonVariants.variants.variant` додай:
   ```tsx
   success: "bg-green-600 text-white hover:bg-green-700"
   ```
2. Використай десь:
   ```tsx
   <Button variant="success">Success!</Button>
   ```
3. Перевір TypeScript автокомпліт (variant="s..." → показує success)

**Estimated time:** 10 хвилин

---

### Завдання 3: Створи compound variant

Зроби icon buttons круглими:

```tsx
compoundVariants: [
  {
    size: "icon",
    class: "rounded-full",
  },
]
```

Тепер `<Button size="icon">` буде круглий!

**Estimated time:** 15 хвилин

---

## 🎯 Висновки

**Що ти вивчив:**
- ✅ CVA pattern для component variants
- ✅ Radix Slot для asChild behavior
- ✅ Shadcn philosophy (simple > fancy)
- ✅ Loading state implementation
- ✅ Accessibility patterns (focus-visible, ring)
- ✅ Trade-offs: gradients vs solid colors

**Наступні кроки:**
1. Спробуй рефакторинг default variant
2. Подивись на інші компоненти (Card, Dialog) - такий же pattern
3. Прочитай [CVA docs](https://cva.style/docs) для advanced patterns
4. Перейди до [Module 03: Component Patterns](../03-component-patterns/index.md)

---

**Питання? Відкривай новий чат з Claude і запитуй!**

**Повернутись до:** [Module 02: Shadcn UI](index.md) | [Learning Home](../index.md)
