# Design Review: Onboarding Wizard

**Дата:** 2026-01-04
**Reviewer:** Claude (Design Perspective)
**Версія:** Current implementation (Dashboard integration)

---

## Executive Summary

**Оцінка:** 5/10 — Функціонально працює, але має критичні UX/UI проблеми

**Ключові проблеми:**
1. 🔴 **Крок 4 зламаний** — translation keys замість тексту (техніка)
2. 🔴 **Візуальна втома** — 4 великі картки займають 50% дашборда навіть у locked стані
3. 🟡 **Конфлікт станів** — "Крок 1: Активно" vs "Тиша в ефірі. Підключіть джерела"
4. 🟡 **Немає згортання** — візард не зникає після completion

---

## 1. Visual Design (Візуальний дизайн)

### ✅ Strengths (Сильні сторони)

| Аспект | Оцінка | Деталі |
|--------|--------|--------|
| **Color Palette** | 8/10 | Чистий dark mode, teal/cyan акценти не "виїдають очі" |
| **Typography** | 7/10 | Читабельно, але заголовки кроків можуть бути більш виразними |
| **Iconography** | 8/10 | Rocket, MessageSquare, Cpu, FileDown — інтуїтивні |
| **Spacing** | 7/10 | Достатньо "повітря", але картки могли б бути компактнішими |
| **Progress Bar** | 9/10 | Чудовий індикатор прогресу в модалі (green teal) |

### ❌ Weaknesses (Слабкості)

```
┌─────────────────────────────────────────────────────────┐
│ Problem: Locked Steps Look "Dead"                       │
├─────────────────────────────────────────────────────────┤
│ Current: [2] 🔒 Організуйте простір                     │
│          Grey icon + Grey text + Lock = "Forbidden"     │
│                                                          │
│ Better:  [2] 🏠 Організуйте простір → Next step         │
│          Dim but clickable, show "Unlock: Step 1"       │
└─────────────────────────────────────────────────────────┘
```

**Візуальна ієрархія:**
- 🔴 **Крок 1 (Active)** виглядає однаково з locked — немає достатнього контрасту
- 🔴 **4 картки візарда** займають 50% viewport — перекривають дашборд
- 🟡 **Немає візуального feedback** на hover (locked кроки не реагують)

---

## 2. User Experience (UX)

### A. Modal Wizard Flow (5 кроків)

**Step 1: Welcome**
```
✅ Good:
- Зрозумілий value proposition: "AI-трекер задач за 4 кроки"
- Rocket icon створює позитивне враження
- "Пропустити" доступно одразу (user control)

❌ Issues:
- "За 4 прості кроки" — але Step 4 (import) може зайняти години
- Немає preview steps (що саме буде далі?)
```

**Step 2: Telegram Setup**
```
✅ Good:
- Чіткі інструкції (1-2-3 кроки)
- Сіра рамка відділяє інструкції від UI

❌ Issues:
- Інструкції generic: "Перейдіть до Settings → Sources"
  Краще: Кнопка "Відкрити Settings" (direct action)
- Немає візуального preview (що побачить юзер у Settings)
```

**Step 3: Agent Setup**
```
✅ Good:
- Cpu icon чітко передає "AI"

❌ Issues:
- Аналогічно Step 2 — generic інструкції
- "Налаштуйте параметри аналізу" — які саме? Невизначеність
```

**Step 4: Import Messages** 🔴 **BROKEN**
```
❌ Critical:
- Translation keys exposed: "import.title", "onboarding.import.depth.skip"
- UI нечитабельний
- Кнопки не працюють (timeouts на click)
- API estimates failing → "import.estimate.unavailable"

✅ Intent Good:
- Концепція вибору глибини імпорту (24h/7d/30d/all) — розумно
- "Recommended" badge на 7d — гарна practice
```

**Step 5: Complete** (не побачив через broken Step 4)

---

### B. Dashboard Integration (4 cards)

```
Current Layout:
┌─────────────────────────────────────────────────────────┐
│ [1] Джерела даних          [2] Організуйте простір     │
│     Активно                    🔒 Заблоковано          │
│     ━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━      │
│ [3] Увімкнути AI-аналітика [4] Перші інсайти           │
│     🔒 Заблоковано             🔒 Заблоковано          │
├─────────────────────────────────────────────────────────┤
│ Доброго вечора, Макс!                                   │
│ Тиша в ефірі. Підключіть джерела даних. ← CONFLICT!    │
└─────────────────────────────────────────────────────────┘
```

**Проблема конфлікту станів:**
- Крок 1: "Активно" (done)
- Subtitle: "Підключіть джерела даних" (todo)
- **Реакція юзера:** "Так я ж підключив! Система глючить?"

**Рекомендація:**
```typescript
// Dynamic subtitle based on wizard state
if (step1Completed && !hasMessages) {
  subtitle = "Слухаємо ефір... Збираємо перші дані." // Listening, not Silence
}
```

---

### C. Progressive Disclosure Issue

```
Problem: "Все або нічого"
┌─────────────────────────────────────────────────────────┐
│ 4 великі картки завжди видимі                            │
│                                                          │
│ Initial:   [1]Active [2]Locked [3]Locked [4]Locked      │
│ After #1:  [1]Done   [2]Active [3]Locked [4]Locked      │
│ After #2:  [1]Done   [2]Done   [3]Active [4]Locked      │
│ After #3:  [1]Done   [2]Done   [3]Done   [4]Pending     │
│ After #4:  [1]Done   [2]Done   [3]Done   [4]Done        │
│            ^^^ Still takes 50% of dashboard! ^^^        │
└─────────────────────────────────────────────────────────┘
```

**Industry Best Practice:**
1. **Collapse on completion:** Після виконання 3/4 кроків → зменшити до 1 рядка
2. **Celebration moment:** "🎉 Налаштування завершено! Система готова."
3. **CTA shift:** Від setup до usage ("Переглянути інсайти")

---

## 3. Interaction Design

### Modal Behavior

| Interaction | Expected | Actual | Status |
|-------------|----------|--------|--------|
| "Назад" (Step 1) | Disabled | ✅ Disabled | ✅ |
| "Продовжити" | Next step | ✅ Works | ✅ |
| "Пропустити" | Close modal | ✅ Works | ✅ |
| ESC key | Close modal | ✅ Works | ✅ |
| Click outside | Close modal | ❌ Not tested | 🟡 |
| "X" button | Close modal | ⏱️ Timeout | 🔴 |

### Dashboard Cards

```
Current: Static, non-interactive (locked steps)
Better:  Show tooltip on hover

Example:
┌─────────────────────────────────────────────────────────┐
│ [2] 🔒 Організуйте простір                              │
│                                                          │
│ Hover tooltip: "Завершіть Крок 1, щоб розблокувати"    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Copywriting (Тексти)

### Аналіз тонов і clarity

| Текст | Тип | Проблема | Краще |
|-------|-----|----------|-------|
| "Джерела даних" | Tech jargon | Роботизовано | "Підключіть канали" |
| "Організуйте простір" | Vague | Що саме? | "Створіть проєкт" |
| "Увімкнути AI-аналітика" | Feature-focused | Немає цінності | "Автоматизувати аналіз" |
| "Перші інсайти" | Passive | Коли з'являться? | "Знайти перші знання" |
| "З'являться автоматично" | Uncertain | Скільки чекати? | "За ~10хв після імпорту" |
| "Тиша в ефірі" | ✅ Good | Гарна метафора | Keep |

### Benefit-driven Copy (що юзер отримує)

**Before (команди):**
- "Підключіть джерела"
- "Активуйте агента"
- "Перший проєкт"

**After (цінність):**
- "Слухати Telegram" → value: автоматичний збір
- "Автоматизувати аналіз" → value: не вручну
- "Організувати знання" → value: структура

---

## 5. Accessibility (a11y)

### Screen Reader Support

```html
<!-- Current -->
<DialogTitle className="sr-only">Майстер налаштування - {stepTitle}</DialogTitle>
✅ Good: Hidden title for SR

<!-- Missing -->
❌ Locked steps need aria-disabled="true" + aria-label="Locked until Step 1"
❌ Progress bar needs aria-valuenow / aria-valuemax
❌ Icon-only buttons need aria-label
```

### Keyboard Navigation

| Action | Support | Status |
|--------|---------|--------|
| Tab navigation | Yes | ✅ |
| Arrow keys (steps) | No | ❌ |
| ESC to close | Yes | ✅ |
| Enter on buttons | Yes | ✅ |

---

## 6. Technical Issues

### 🔴 Critical Bugs

```typescript
// 1. Translation keys exposed (Step 4)
"import.title"
"onboarding.import.depth.skip"
// Missing: i18n fallback or namespace check

// 2. Button timeouts (Step 4)
Locator.click → Timeout after 5000ms
// Possible: Event handler not attached or loading state blocking
```

### 🟡 Minor Issues

```typescript
// 1. No loading states on "Продовжити"
// Should show spinner if async validation

// 2. No error boundaries
// If Step fails, whole wizard crashes?

// 3. localStorage keys not scoped
localStorage.setItem('onboarding_completed', 'true')
// Better: 'pulse_radar:onboarding:completed'
```

---

## 7. Recommended Solutions

### A. Immediate Fixes (Critical)

```typescript
// 1. Fix Step 4 translations
// Check: frontend/public/locales/uk/onboarding.json
// Ensure all keys exist with "import.*" prefix

// 2. Fix button timeouts
// Debug: onClick handlers in HistoryImportSection.tsx
// Add loading states

// 3. Fix status conflict
const subtitle = useMemo(() => {
  if (step1Completed && !hasMessages) {
    return "Слухаємо ефір... Збираємо перші дані."
  }
  if (!step1Completed) {
    return "Тиша в ефірі. Підключіть джерела даних."
  }
  // ... rest
}, [step1Completed, hasMessages])
```

### B. UX Improvements (High Priority)

**1. Collapsible Wizard**

```typescript
// After 3/4 manual steps completed → collapse
const isWizardCollapsible = step3Status === 'completed'

return (
  <div className={cn(
    "transition-all duration-500",
    isWizardCollapsible ? "h-16" : "h-auto"
  )}>
    {isWizardCollapsible ? (
      <CompactBanner>
        🎉 Налаштування завершено! Очікуємо перші дані...
        <Button size="sm" onClick={expandWizard}>Деталі</Button>
      </CompactBanner>
    ) : (
      <FullWizardCards />
    )}
  </div>
)
```

**2. Interactive Locked Steps**

```tsx
// Show tooltip on hover
<Tooltip>
  <TooltipTrigger asChild>
    <Card className="opacity-60 cursor-not-allowed">
      🔒 Організуйте простір
    </Card>
  </TooltipTrigger>
  <TooltipContent>
    Завершіть Крок 1 (Джерела даних), щоб розблокувати
  </TooltipContent>
</Tooltip>
```

**3. Direct Actions (не інструкції)**

```tsx
// Instead of "Перейдіть до Settings → Sources"
<Button onClick={() => navigate('/settings?tab=sources')}>
  Підключити Telegram
</Button>
```

### C. Visual Refinements (Medium Priority)

**1. Step Status Visual Hierarchy**

```css
/* Current: All steps look similar */
.wizard-card { opacity: 0.5; } /* Locked */
.wizard-card.active { opacity: 1; border: 2px solid teal; }

/* Better: Clear progression */
.wizard-card.locked {
  opacity: 0.3;
  filter: grayscale(0.8);
  border: 1px dashed gray;
}
.wizard-card.active {
  opacity: 1;
  border: 2px solid teal;
  box-shadow: 0 0 0 4px rgba(teal, 0.1); /* Glow effect */
  animation: pulse 2s infinite;
}
.wizard-card.completed {
  opacity: 0.7;
  border: 1px solid green;
}
```

**2. Celebration Moment**

```tsx
// After Step 3 completed → show confetti or animation
{step3Status === 'completed' && !hasShownCelebration && (
  <Confetti recycle={false} numberOfPieces={200} />
)}
```

---

## 8. Comparative Analysis (Industry Standards)

### Similar Onboarding Patterns

| Product | Pattern | Why It Works |
|---------|---------|--------------|
| **Slack** | Checklist in sidebar | Persistent, non-intrusive, collapsible |
| **Linear** | Inline tutorial (1 step at a time) | Contextual, progressive disclosure |
| **Notion** | Dismissible banner + optional tour | User control, not blocking |
| **GitHub** | Profile completion widget | Gamification (% complete), collapsible |

**Pulse Radar Current:**
- ❌ 4 large cards always visible (intrusive)
- ❌ Modal wizard (blocking, but skippable)
- ✅ Progress bar (good)
- ❌ No celebration (anticlimax)

**Recommendation:** Hybrid approach
1. Modal wizard for first-time setup (current ✅)
2. Compact checklist on dashboard (add ✨)
3. Auto-collapse after completion (add ✨)

---

## 9. Final Scores

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| **Visual Design** | 7/10 | 20% | 1.4 |
| **UX Flow** | 4/10 | 30% | 1.2 |
| **Interaction** | 5/10 | 15% | 0.75 |
| **Copywriting** | 6/10 | 10% | 0.6 |
| **Accessibility** | 6/10 | 10% | 0.6 |
| **Technical** | 3/10 | 15% | 0.45 |
| **Total** | — | — | **5.0/10** |

---

## 10. Action Plan (Пріоритезація)

### P0: Blocker (Must Fix Before Release)
- [ ] Fix Step 4 translation keys
- [ ] Fix button click timeouts
- [ ] Fix status conflict ("Активно" vs "Підключіть джерела")

### P1: Critical UX (This Sprint)
- [ ] Implement wizard collapse after step 3
- [ ] Add celebration moment (🎉)
- [ ] Replace instructions with direct action buttons
- [ ] Add tooltips to locked steps

### P2: Polish (Next Sprint)
- [ ] Improve visual hierarchy (active/locked contrast)
- [ ] Better copywriting (benefit-driven)
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add error boundaries

### P3: Nice-to-Have (Backlog)
- [ ] Animated step transitions
- [ ] Progress persistence (resume from step)
- [ ] Skip individual steps (not just "Пропустити" all)
- [ ] Analytics tracking (drop-off rates)

---

## Conclusion

**Summary:** Візард має **гарну концепцію** (4-step setup, progress bar, skippable), але **критичні технічні баги** (Step 4) та **UX issues** (візуальна втома, конфлікт станів, немає згортання) знижують оцінку до **5/10**.

**Key Takeaway:** Fix P0 bugs → Add collapse → Improve copy → Візард стане 8-9/10.

**Чи користувач завершить setup?**
- Current: 50-60% (фрустрація від locked steps + broken Step 4)
- After fixes: 80-85% (smooth flow + celebration)

---

**Next Steps:**
1. Share з командою
2. Створити GitHub issues (P0/P1/P2)
3. Prototype collapse behavior у Figma
4. A/B test copywriting варіанти
