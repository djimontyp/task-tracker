# REF-002: Crypto Dashboard - Dark Mode

**Джерело:** [Dribbble](https://dribbble.com/shots/26123474-Crypto-Dashboard-Dark-Mode)
**Автор:** Dwinawan for Paperpillar

![REF-002 Crypto Dashboard](../screenshots/REF-002-crypto-dashboard-dark.png)

## Що подобається

- [x] **Глибока темна тема** — майже чорний фон (#050402), елегантний та сучасний
- [x] **Lighting effects** — тонкі світлові ефекти на картках (glow), футуристичний вайб
- [x] **Portfolio card** — центральний акцент з підсвічуванням
- [x] **Кольорова палітра** — приглушені кольори з яскравим помаранчевим акцентом (#C34114)
- [x] **Mega search box** — глобальний пошук з grouped content та recent searches
- [x] **Notification panel** — чистий дизайн нотифікацій
- [x] **Sci-fi естетика** — сучасний, трохи футуристичний інтерфейс

## Ключові елементи

### Кольори
| Роль | Колір | Застосування |
|------|-------|--------------|
| Background | `#050402` | Основний фон (майже чорний) |
| Card | `#3D464C` | Картки, панелі |
| Accent primary | `#C34114` | Помаранчевий акцент, CTA |
| Accent secondary | `#2B5975` | Синій акцент, графіки |
| Text primary | `#F9F9F8` | Заголовки, числа |
| Text secondary | `#A2A39D` | Описи, labels |
| Glow | `#4B1D08` | Підсвічування карток |

### Layout
- **Sidebar** — мінімалістичний, іконки з підсвічуванням
- **Cards** — з subtle glow effect по краях
- **Spacing** — генеративний простір, ~20-28px між секціями
- **Border radius** — м'які кути ~12-16px

### Унікальні елементи

| Елемент | Опис | Цікавість |
|---------|------|-----------|
| **Glow cards** | Картки з тонким світінням по краях | 🔥 Преміум вигляд |
| **Mega search** | Dropdown з категоріями та recent | 🔥 UX pattern |
| **Notification stack** | Grouped notifications з actions | Medium |
| **Portfolio highlight** | Центральна картка з акцентом | Medium |

### Типографіка
- **Numbers** — великі, semi-bold (~28-40px)
- **Labels** — маленькі, приглушені
- **Hierarchy** — контраст через світло/тінь, не тільки розмір

## Як застосувати в Pulse Radar

| Елемент з референсу | Де в Pulse Radar | Статус |
|---------------------|------------------|--------|
| Deep dark palette | Alternative dark theme | 🔜 TODO |
| Glow card effect | Featured/important cards | 🔜 TODO |
| Mega search | Global search component | 🔜 TODO |
| Notification design | NavNotifications | 🔜 TODO |
| Orange accent | Semantic warning/important | ✅ Є (semantic-warning) |

## Нотатки

**Що НЕ копіювати:**
- Crypto-specific елементи (portfolio charts, coin icons)
- Занадто сильний glow може відволікати

**Ідеї для адаптації:**
- Glow effect для: Important atoms, Featured topics, Active alerts
- Mega search для: Global search across messages, atoms, topics
- Notification stack для: Real-time WebSocket notifications
- Deep dark theme як альтернатива поточній темній темі

## Порівняння з REF-001

| Аспект | REF-001 (Fitness) | REF-002 (Crypto) |
|--------|-------------------|------------------|
| Фон | `#0D0D0D` (dark gray) | `#050402` (near black) |
| Стиль | Clean, minimal | Futuristic, glowy |
| Акцент | Green (#4ADE80) | Orange (#C34114) |
| Mood | Professional | Premium, sci-fi |
