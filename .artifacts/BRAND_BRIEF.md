# Pulse Radar — Brand Brief

> **Для передачі в інший чат/агент**
> **Затверджено:** 2025-12-05

---

## TL;DR

```
Шрифт:    Raleway (Google Fonts, Cyrillic support)
Акцент:   Золотий/Amber #B88F4A
Glow:     Так, subtle на важливих елементах
Spacing:  24px між секціями (4px grid)
Теми:     Dark (primary) + Light
Слоган:   "Data-Focused Minimalism — clarity over cleverness, data shines, UI disappears"
```

---

## 1. Шрифт: Raleway

**Причина вибору:** тонкий, елегантний, витончений, підтримує українську + англійську

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
font-family: 'Raleway', sans-serif;
```

**Для чисел/даних (опціонально):**
```css
font-family: 'JetBrains Mono', monospace;
```

---

## 2. Акцентний колір: Amber/Золотий

```css
/* Primary */
--accent: #B88F4A;

/* Variations */
--accent-light: #D4A85A;      /* hover */
--accent-dark: #8B6914;       /* pressed */
--accent-muted: #B88F4A40;    /* 25% opacity, backgrounds */
--accent-glow: #B88F4A30;     /* glow effects */
```

**Tailwind config:**
```js
colors: {
  accent: {
    DEFAULT: '#B88F4A',
    light: '#D4A85A',
    dark: '#8B6914',
    muted: 'rgba(184, 143, 74, 0.25)',
    glow: 'rgba(184, 143, 74, 0.19)',
  }
}
```

---

## 3. Glow ефекти

**CSS:**
```css
.card-glow {
  box-shadow:
    0 0 20px rgba(184, 143, 74, 0.19),
    0 0 40px rgba(184, 143, 74, 0.05);
}

.card-glow:hover {
  box-shadow:
    0 0 30px rgba(184, 143, 74, 0.25),
    0 0 60px rgba(184, 143, 74, 0.10);
}
```

**Tailwind (custom):**
```js
boxShadow: {
  'glow': '0 0 20px rgba(184, 143, 74, 0.19), 0 0 40px rgba(184, 143, 74, 0.05)',
  'glow-lg': '0 0 30px rgba(184, 143, 74, 0.25), 0 0 60px rgba(184, 143, 74, 0.10)',
}
```

**Де використовувати:**
- Featured/important atoms
- Critical alerts
- Hover на важливих картках
- Active states

**Де НЕ використовувати:**
- Звичайні картки
- Navigation
- Forms
- Списки

---

## 4. Spacing: 24px

**Grid:** 4px base

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;   /* PRIMARY */
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

**Застосування:**
- Між секціями: `24px` (gap-6)
- Card padding: `24px` (p-6)
- Між картками в grid: `16px` (gap-4)
- Внутрішній spacing: `8px` (gap-2)

---

## 5. Кольорова палітра

### Dark Theme (Primary)
```css
--background: #030304;
--card: #0D1117;
--card-hover: #161B22;
--border: #3C4B62;
--text-primary: #F0F0F0;
--text-secondary: #9CA3AF;
--text-muted: #6B7280;
```

### Light Theme
```css
--background: #FAFAFA;
--card: #FFFFFF;
--card-hover: #F5F5F5;
--border: #E5E7EB;
--text-primary: #1A1A1A;
--text-secondary: #4B5563;
--text-muted: #9CA3AF;
--card-shadow: 0 1px 3px rgba(0,0,0,0.08);
```

---

## 6. Компоненти для оновлення

### Priority 1 (Core)
- `tailwind.config.js` — font, colors, shadows
- CSS variables в `globals.css`
- Button — accent color, glow variant
- Card — 24px padding, glow variant
- Badge — accent variant

### Priority 2 (Dashboard)
- MetricCard — glow on important
- TopicCard — hover glow
- MessageCard — importance glow

### Priority 3 (Polish)
- Sidebar active states
- Navigation accent
- Form focus glow

---

## 7. Storybook вимоги

Кожен оновлений компонент має мати stories:
1. Default state
2. With glow (featured)
3. Light theme
4. Dark theme
5. Ukrainian text

---

## 8. Референси

| ID | Назва | Що взяти |
|----|-------|----------|
| REF-001 | Fitness Dashboard | Metric cards, clean layout |
| REF-002 | Crypto Dashboard | Glow effects, deep dark |
| REF-003 | PM Dashboard | Structure, activity feed |

**Напрямок:** структура REF-003 + glow REF-002 + чистота REF-001

---

## 9. Файли в проєкті

```
.artifacts/
├── BRAND_BRIEF.md          ← цей файл (для передачі)
├── BRAND_DECISIONS.md      ← повні рішення
├── BRAND_STYLE_ANALYSIS.md ← UX аналіз
├── BRAND_STRATEGY.md       ← Product Designer аналіз
├── BRAND_COLOR_PALETTE.md  ← кольори детально
└── VISUAL_CONCEPTS_EXPLAINED.md ← пояснення glow/spacing

docs/design-system/references/
├── concepts/REF-001-fitness-dashboard.md
├── concepts/REF-002-crypto-dashboard-dark.md
├── concepts/REF-003-project-management-dashboard.md
└── screenshots/*.png
```

---

## 10. Copy-paste для нового чату

```
Контекст для реалізації Brand Style Pulse Radar:

ШРИФТ: Raleway (Google Fonts, підтримує UA+EN)
АКЦЕНТ: #B88F4A (золотий/amber) з варіаціями light/dark/muted/glow
GLOW: Subtle box-shadow на важливих елементах (atoms, alerts, hover)
SPACING: 24px між секціями, 4px grid base
ТЕМИ: Dark (#030304 bg) + Light (#FAFAFA bg)

Деталі: .artifacts/BRAND_BRIEF.md та .artifacts/BRAND_DECISIONS.md
Референси: docs/design-system/references/

Слоган: "Data-Focused Minimalism — clarity over cleverness, data shines, UI disappears"

Стиль: витончений, елегантний, чіткий, premium
```
