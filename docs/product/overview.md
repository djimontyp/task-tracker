# Огляд продукту

## Що таке Pulse Radar?

Pulse Radar — це AI-система, яка перетворює хаос командної комунікації в структуровані знання.

---

## Core Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TELEGRAM   │────▶│   ІНГЕСТ    │────▶│     AI      │────▶│  DASHBOARD  │
│   (100+     │     │  + Scoring  │     │ Extraction  │     │   Insights  │
│  msg/day)   │     │             │     │             │     │   Search    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 4 шари обробки

### Layer 1: Raw Messages
- Швидкий інгест з Telegram webhook
- Зберігання: content, author, timestamp

### Layer 2: Signal/Noise Filtering
- 4-факторний scoring (content, author, time, topic)
- Класифікація: **signal** (>0.65) / **noise** (<0.25)

### Layer 3: Knowledge Extraction
- AI витягує сутності: TASK, IDEA, DECISION, PROBLEM, QUESTION
- Групування по Topics
- Зв'язки між Atoms

### Layer 4: Dashboard
- Агреговані метрики
- Тренди тижня
- Семантичний пошук

---

## Типи знань (Atoms)

| Тип | Опис | Приклад |
|-----|------|---------|
| **TASK** | Задача, яку треба виконати | "Виправити баг авторизації" |
| **IDEA** | Пропозиція для обговорення | "Додати dark mode" |
| **DECISION** | Прийняте рішення | "Використовуємо PostgreSQL" |
| **PROBLEM** | Виявлена проблема | "API повільний на проді" |
| **QUESTION** | Питання без відповіді | "Який фреймворк обрати?" |
| **INSIGHT** | Корисне спостереження | "Конкурент X запустив фічу Y" |

---

## Scoring алгоритм

```
importance_score = (content × 0.4) + (author × 0.2) + (temporal × 0.2) + (topics × 0.2)
```

### Фактори:

**Content (40%):**
- Довжина тексту
- Ключові слова: "bug", "urgent", "idea", "decided"
- Наявність URL, code blocks, питань

**Author (20%):**
- Історія автора (середній score)
- Trusted authors отримують boost

**Temporal (20%):**
- Свіжі повідомлення важливіші
- Активні топіки отримують boost

**Topics (20%):**
- Активність топіка
- Кількість повідомлень

---

## Інтеграції

### Поточні:
- **Telegram** — основне джерело

### Плановані:
- Slack
- Discord
- Email

---

## Технології

| Компонент | Технологія |
|-----------|------------|
| Backend | FastAPI, Python 3.12 |
| Frontend | React 18, TypeScript |
| Database | PostgreSQL + pgvector |
| AI | OpenAI GPT-4 / Ollama |
| Queue | NATS JetStream + TaskIQ |
| Real-time | WebSocket |
