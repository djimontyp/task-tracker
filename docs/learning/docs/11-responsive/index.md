# Module 11: Responsive Design

**Mobile-first patterns з Tailwind breakpoints**

---

## 🎯 Що це

**Responsive Design** - адаптивний UI для різних екранів. Mobile-first approach: базові стилі для mobile → breakpoints для desktop.

**Key pattern:** DataTable на desktop → mobile cards на phone

---

## 🔄 Backend аналогія

| Backend (API) | Frontend (Responsive) |
|---------------|---------------------|
| Content negotiation | Media queries |
| `Accept: application/json` | `@media (min-width: 768px)` |
| API versioning | Breakpoint versions |
| Response adaptation | UI adaptation |

```python
# Backend (content negotiation)
if request.accept == "application/json":
    return JSONResponse(data)
else:
    return HTMLResponse(template)

# Frontend (responsive analog)
{/* Mobile */}
<div className="block md:hidden">Mobile UI</div>
{/* Desktop */}
<div className="hidden md:block">Desktop UI</div>
```

---

## 📂 У твоєму проекті

**Tailwind breakpoints:**
- `sm`: 640px (tablet portrait)
- `md`: 768px (tablet landscape)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

**DataTable responsive pattern:**
- `src/shared/components/DataTable/index.tsx` - responsive table
- Desktop: `<Table>` з columns
- Mobile: `renderMobileCard` prop → custom card layout

**Examples:**
```typescript
// Button responsive height
className="h-10 md:h-11"

// Text size
className="text-sm lg:text-lg"

// Layout switch
className="flex-col md:flex-row"
```

**useIsMobile() hook:**
```typescript
const isMobile = useIsMobile()  // true якщо < 768px
```

---

## 💡 Ключові концепції

### 1. Mobile-First Approach
Базові стилі = mobile → breakpoints додають complexity

```typescript
// Mobile: full width, Desktop: 1/3 width
className="w-full md:w-1/3"
```

### 2. Breakpoint Prefixes
`md:`, `lg:`, `xl:` - apply styles від breakpoint і вище

### 3. Hide/Show Pattern
```typescript
// Show on mobile only
className="block md:hidden"

// Show on desktop only
className="hidden md:block"
```

### 4. DataTable Mobile Pattern
Desktop: Table → Mobile: Cards з renderMobileCard prop

### 5. Touch Targets
Mobile buttons >= 44px height (accessibility)

---

## ✅ Коли використовувати responsive

- ✅ App має mobile users
- ✅ Tables з багатьма columns
- ✅ Complex layouts
- ✅ Navigation menus

## ❌ Коли можна пропустити

- ❌ Admin-only tool (desktop only)
- ❌ Internal dashboard
- ❌ Embedded widget (fixed size)

---

## 🚫 Типові Помилки

### 1. Desktop-First Замість Mobile-First
```tsx
// ❌ НЕ РОБИ: Desktop-first
<div className="w-1/2 sm:w-full">  // ❌ Backwards!

// ✅ РОБИ: Mobile-first
<div className="w-full md:w-1/2">  // ✅ Mobile → Desktop
```

### 2. Fixed Breakpoints Без Міркувань
```tsx
// ❌ НЕ РОБИ: Breakpoints "бо так"
<div className="md:grid-cols-3">  // Чому саме md?

// ✅ РОБИ: Test на реальних девайсах
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### 3. Фіксовані px Замість %/rem
```tsx
// ❌ НЕ РОБИ
<div className="w-[800px]">  // Ламається на мобілці

// ✅ РОБИ
<div className="w-full max-w-4xl">
```

### 4. Не Тестують на Мобілці
```tsx
// Завжди тестуй Chrome DevTools → Responsive mode
// Breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
```

---

## 📚 Офіційна документація

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design) ✅
- [Breakpoints](https://tailwindcss.com/docs/breakpoints) ✅
- [Mobile-First](https://tailwindcss.com/docs/responsive-design#mobile-first) ✅

---

## 🛠️ Практика

1. Відкрий `src/shared/components/DataTable/index.tsx`
2. Знайди responsive logic (table vs mobile cards)
3. Resize browser → подивись breakpoints
4. Спробуй додати нову responsive feature

**Estimated time:** 1-2 години

---

## ❓ FAQ

**Q: Mobile-first vs Desktop-first?**
A: Mobile-first = менше CSS, easier progressive enhancement.

**Q: Як тестувати responsive?**
A: Chrome DevTools → Device toolbar (Cmd+Shift+M).

**Q: Breakpoint sizes - чому саме 768px?**
A: Industry standard. iPad portrait = 768px.

---

**Далі:** [DataTable Pattern Deep Dive](datatable-pattern.md)

**Повернутись до:** [Learning Home](../index.md)
