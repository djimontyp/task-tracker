# Pulse Radar — Brand Decisions

> **Затверджено:** 2025-12-05

## Слоган

> **"Data-Focused Minimalism — clarity over cleverness, data shines, UI disappears"**

---

## Візуальна ідентичність

### Шрифт: Raleway

**Чому:**
- Тонкий, елегантний, витончений
- Підтримує українську та англійську
- Variable font (гнучкість ваг)
- Відповідає бренд-позиціонуванню "refined"

**Застосування:**
```css
/* Primary font */
font-family: 'Raleway', sans-serif;

/* For data/numbers (optional) */
font-family: 'JetBrains Mono', monospace;
```

**Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

### Акцентний колір: Золотий/Amber

**Primary accent:** `#B88F4A`
**Variations:**
```css
--accent: #B88F4A;           /* Primary */
--accent-light: #D4A85A;     /* Hover, highlights */
--accent-dark: #8B6914;      /* Active, pressed */
--accent-muted: #B88F4A40;   /* Backgrounds, 25% opacity */
--accent-glow: #B88F4A30;    /* Glow effects */
```

**Символізм:**
- Premium quality
- Valuable insights (золото = цінність)
- Elegant, sophisticated
- Warm but professional

**Де використовувати:**
- Primary CTA buttons
- Important badges/highlights
- Navigation active states
- Glow на featured cards
- Progress indicators

---

### Glow ефекти: Так (Subtle)

**CSS Implementation:**
```css
/* Subtle glow for featured/important cards */
.card-glow {
  box-shadow:
    0 0 20px var(--accent-glow),
    0 0 40px rgba(184, 143, 74, 0.05);
  transition: box-shadow 0.3s ease;
}

.card-glow:hover {
  box-shadow:
    0 0 30px var(--accent-glow),
    0 0 60px rgba(184, 143, 74, 0.10);
}
```

**Де використовувати:**
- Featured atoms (high importance)
- Critical alerts
- Active/selected cards
- Hover states на важливих елементах

**Де НЕ використовувати:**
- Звичайні картки
- Navigation
- Form elements
- Списки

---

### Spacing: 24px базовий

**Grid система (4px base):**
```css
--spacing-xs: 4px;    /* 1 unit */
--spacing-sm: 8px;    /* 2 units */
--spacing-md: 16px;   /* 4 units */
--spacing-lg: 24px;   /* 6 units - PRIMARY */
--spacing-xl: 32px;   /* 8 units */
--spacing-2xl: 48px;  /* 12 units */
```

**Застосування:**
```css
/* Between sections */
.section-gap { gap: var(--spacing-lg); }  /* 24px */

/* Card padding */
.card { padding: var(--spacing-lg); }  /* 24px */

/* Between cards in grid */
.card-grid { gap: var(--spacing-md); }  /* 16px */

/* Internal card spacing */
.card-content { gap: var(--spacing-sm); }  /* 8px */
```

---

### Теми: Темна + Світла

#### Dark Theme (Primary)
```css
:root.dark {
  --background: #030304;
  --card: #0D1117;
  --card-hover: #161B22;
  --border: #3C4B62;
  --text-primary: #F0F0F0;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
}
```

#### Light Theme
```css
:root {
  --background: #FAFAFA;
  --card: #FFFFFF;
  --card-hover: #F5F5F5;
  --border: #E5E7EB;
  --text-primary: #1A1A1A;
  --text-secondary: #4B5563;
  --text-muted: #9CA3AF;
  /* Shadows for depth */
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
```

**Принципи світлої теми:**
- Достатній контраст (WCAG AA: 4.5:1)
- Тіні замість borders для глибини
- Accent колір працює в обох темах
- Нічого не зливається

---

## Компоненти для оновлення

### Priority 1 (Core)
- [ ] Tailwind config — нові кольори, шрифт
- [ ] CSS variables — accent, glow, spacing
- [ ] Button — accent color, glow on primary
- [ ] Card — spacing 24px, glow variant
- [ ] Badge — accent variant

### Priority 2 (Dashboard)
- [ ] MetricCard — glow on important metrics
- [ ] TopicCard — hover glow
- [ ] MessageCard — importance glow

### Priority 3 (Polish)
- [ ] Sidebar — active state glow
- [ ] Navigation — accent underlines
- [ ] Forms — focus glow

---

## Storybook Stories

Кожен компонент має мати stories що демонструють:
1. Default state
2. With glow (featured variant)
3. Light theme
4. Dark theme
5. Ukrainian text

---

## Референси

- REF-001: Fitness Dashboard (metric cards, clean layout)
- REF-002: Crypto Dashboard (glow effects, deep dark)
- REF-003: PM Dashboard (structure, activity feed)

**Наш напрямок:** Комбінація — структура REF-003 + glow REF-002 + чистота REF-001

---

## Next Steps

1. Оновити `tailwind.config.js` з новими кольорами
2. Додати Raleway font
3. Створити CSS variables для glow
4. Оновити Button, Card, Badge в Storybook
5. Перевірити в обох темах
6. Документувати в Design System docs
