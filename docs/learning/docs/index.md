# 🎓 Frontend Learning Program

**Для backend розробників які хочуть стати fullstack**

Ця програма побудована на **твоєму реальному проекті** Pulse Radar. Замість абстрактних TodoApp - аналізуємо і покращуємо існуючий код крок за кроком.

---

## 🎯 Підхід: First Principles на реальному коді

```
Кожен модуль:
1. Аналіз твого коду → що не так і чому
2. Розуміння концепції → навіщо це потрібно
3. Backend аналогія → порівняння з FastAPI/SQLAlchemy
4. Рефакторинг → покращення з поясненням
5. Практика → що спробувати далі
```

**Не пишеш демо-проекти, а покращуєш реальний продакшн код!**

---

## 📚 Модулі програми

| # | Модуль | Тема | Час | Статус |
|---|--------|------|-----|--------|
| 00 | [Foundations](00-foundations/index.md) | React mental model для backend девелоперів | 3h | ⬜ |
| 01 | [Styling](01-styling/index.md) | Tailwind + CSS Variables + Dark Mode | 4h | ⬜ |
| 02 | [Shadcn UI](02-shadcn-ui/index.md) | Component library philosophy + Button розбір | 5h | ⬜ |
| 03 | [Component Patterns](03-component-patterns/index.md) | Composition, forwardRef, Props | 3h | ⬜ |
| 04 | [State: Zustand](04-state-zustand/index.md) | Client state management | 4h | ⬜ |
| 05 | [State: TanStack Query](05-state-tanstack/index.md) | Server state, caching, mutations | 5h | ⬜ |
| 06 | [Data Fetching](06-data-fetching/index.md) | Service pattern, API layer | 3h | ⬜ |
| 07 | [WebSocket](07-websocket/index.md) | Real-time communication | 4h | ⬜ |
| 08 | [Forms](08-forms/index.md) | react-hook-form + Zod validation | 4h | ⬜ |
| 09 | [Routing](09-routing/index.md) | React Router + Lazy loading | 3h | ⬜ |
| 10 | [Custom Hooks](10-hooks/index.md) | Creating reusable hooks | 3h | ⬜ |
| 11 | [Responsive](11-responsive/index.md) | Mobile patterns, DataTable | 3h | ⬜ |
| 12 | [Project Structure](12-project-structure/index.md) | Feature-based architecture | 2h | ⬜ |

**Загалом:** ~46 годин (або коли є час без графіка)

---

## 🚀 З чого почати?

### Варіант 1: Quick Win (рекомендовано)
**Почни з [Module 02: Button Deep Dive](02-shadcn-ui/button-deep-dive.md)**

- Бачиш візуальний результат одразу
- Покриває 4 концепції (CVA, Radix, Tailwind, Shadcn)
- Покращуєш реальний компонент
- 🔥 Найдетальніший модуль як приклад

### Варіант 2: Систематично
**Почни з [Module 00: Foundations](00-foundations/index.md)**

- React mental model
- Порівняння з backend thinking
- JSX, TypeScript, Build tools

### Варіант 3: За інтересом
**Обери що цікаво:**
- State management → Module 04 (Zustand)
- API calls → Module 06 (Data Fetching)
- Styling → Module 01 (Tailwind)

---

## 💡 Як користуватись

### 1 чатік = 1 урок

```bash
# Запусти документацію
just docs
# → http://127.0.0.1:8081

# Відкрий модуль
# Прочитай теорію
# Подивись приклади з твого коду
# Спробуй завдання
# Задай питання Claude в новому чаті
```

### Формат кожного уроку

- **🎯 Що це і навіщо** - коротке пояснення
- **🔄 Backend аналогія** - порівняння з FastAPI
- **📂 У твоєму проекті** - файл:рядки з реальним кодом
- **💡 Як працює** - детальне пояснення
- **✅/❌ Коли використовувати** - trade-offs
- **📚 Офіційна документація** - перевірені лінки
- **🛠️ Практика** - що спробувати

---

## 📖 Додаткові матеріали

- **[Resources](resources.md)** - всі перевірені лінки в одному місці
- **Офіційна документація** - вбудована в кожен модуль
- **Твій код** - приклади з `src/` з номерами рядків

---

## ✅ Prerequisites

**Що вже маєш знати:**
- ✅ TypeScript basics
- ✅ Backend досвід (FastAPI/Django/Flask)
- ✅ REST API concepts
- ✅ Git basics

**Що вивчиш:**
- React 18 (hooks, components, lifecycle)
- Tailwind CSS (utility-first approach)
- Shadcn/ui + Radix (component patterns)
- State management (Zustand, TanStack Query)
- Real-time (WebSocket)
- Forms (react-hook-form + Zod)
- Routing (React Router v7)

---

## 🎓 Learning Philosophy

### Не TodoApp, а реальний проект

**Замість:**
```tsx
// Generic example
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>
    {count}
  </button>
}
```

**Вивчаємо:**
```tsx
// Твій Button з src/shared/ui/button.tsx:8-36
const buttonVariants = cva("inline-flex items-center...", {
  variants: {
    variant: {
      default: "border border-accent/30 bg-gradient-to-r from-primary..."
      // ↑ Чому градієнт? Чому складно? Як краще?
    }
  }
})
```

### Backend → Frontend mapping

| Backend (FastAPI) | Frontend (React) | Module |
|-------------------|------------------|--------|
| `class UserService` | Service pattern | 06 |
| SQLAlchemy ORM cache | TanStack Query | 05 |
| Pydantic validation | Zod + react-hook-form | 08 |
| WebSocket endpoint | Native WebSocket hook | 07 |
| Dependency Injection | React Context | 03 |
| Instance variables | useState hook | 00 |
| Lifecycle (startup/shutdown) | useEffect hook | 00 |

---

## 📊 Progress Tracking

**В Linear (через MCP):**
- Створюй tasks для кожного модуля
- Відмічай completed після проходження
- Додавай notes з learnings

**Або просто в цій таблиці:**
- ⬜ Not started
- 🔄 In progress
- ✅ Completed

---

## 🔥 Hot Start

**Готовий почати прямо зараз?**

1. **[Module 02: Button Deep Dive →](02-shadcn-ui/button-deep-dive.md)**
   - Аналіз твого Button компонента
   - Shadcn philosophy
   - CVA patterns
   - Практичний рефакторинг

2. **Або [Resources →](resources.md)** - подивись всі доступні матеріали

---

**Успішного навчання! 🚀**

*Питання? Відкривай новий чат з Claude і запитуй про конкретний модуль.*
