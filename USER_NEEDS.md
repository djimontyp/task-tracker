# User Needs: Information Noise Filtering System

## 🎯 Core Problem

**Information Overload:** Потік повідомлень з різних джерел (Telegram, Email, etc.) створює шум, який заважає бачити реально важливу інформацію.

**Current Reality:**
- 100 повідомлень на день
- 80% - шум (chitchat, "+1", "ok", memes, generic responses)
- 20% - цінна інформація (проблеми, ідеї, питання)
- Людина фізично не може переглянути всі повідомлення
- Важлива інформація губиться в шумі

---

## 👤 User Journey (Ideal State)

### 1. Людина НЕ дивиться в повідомлення

**Principle:** Повідомлення - це raw data, не для людського споживання.

```
❌ BAD: Людина читає 100 messages щодня
✅ GOOD: Людина читає 5 structured insights щодня
```

**Metaphor:** Як Google Analytics - ти не дивишся в raw logs сервера, ти дивишся дашборд з metrics.

---

### 2. Людина працює з витягами (Atoms)

**Principle:** Система автоматично витягує structured entities з шуму.

**Example:**
```
100 messages про "iOS crash"
    ↓ (automatic extraction)
1 Atom: "iOS 17.2 login crash pattern"
    ├─ Type: Problem
    ├─ Severity: Critical
    ├─ Occurrences: 15
    └─ Source: 15 messages (linked)
```

**Human Task:** Переглянути atom (30 секунд), а НЕ 15 messages (5 хвилин).

---

### 3. Людина бачить агреговані тренди

**Principle:** High-level view показує що відбувається в системі без деталей.

**Dashboard Example:**
```
🚨 Critical Issues (цього тижня):
├─ iOS crashes ↑ 300%
├─ Database timeouts ↑ 50%
└─ Memory leak detected

💡 Feature Requests:
├─ Dark mode (2 requests)
└─ Export functionality (1 request)

📊 Statistics:
├─ 100 messages processed
├─ 60 filtered as noise
└─ 5 atoms extracted
```

**Human Task:** Швидко побачити що критично і що потребує уваги.

---

### 4. Drill-down тільки при потребі

**Principle:** Деталі доступні тільки коли щось не так.

**User Flow:**
```
Dashboard → Click "iOS crashes"
    ↓
Atom Detail: "iOS 17.2 login crash"
    ↓ (щось виглядає не так)
Click "View source messages"
    ↓
15 messages показані
    ↓ (знайшов 2 false positives)
Mark 2 messages as "irrelevant"
    ↓
System recalculates atom confidence
```

**Frequency:** 5% випадків (edgecase), не норма.

---

## 🎯 Core User Needs

### Need 1: Не втратити жодне повідомлення

**Requirement:**
- Всі повідомлення мають бути збережені
- Швидке збереження (не блокувати ingestion)
- Можливість відновити з архіву

**User Story:**
> Як користувач, я хочу бути впевнений що система зберігає всі дані,
> навіть якщо вони зараз виглядають як шум, бо контекст може змінитися.

---

### Need 2: Фокус на важливому, ігнорувати шум

**Requirement:**
- Автоматично відсіяти noise (chitchat, "+1", memes)
- Показувати тільки valuable information
- Noise не відображається в UI за замовчуванням

**User Story:**
> Як користувач, я хочу бачити тільки те що важливо для моєї роботи,
> без необхідності фільтрувати шум вручну.

---

### Need 3: Структуровані витяги замість raw messages

**Requirement:**
- System витягує entities (problems, ideas, questions)
- Entities мають структуру (type, title, content, confidence)
- Multiple messages → single entity (aggregation)

**User Story:**
> Як користувач, я хочу працювати зі структурованими витягами,
> а не читати десятки схожих повідомлень про одну проблему.

---

### Need 4: Контекст і час мають значення

**Requirement:**
- Той самий message може мати різне значення в різний час
- Sliding window - тільки recent context важливий
- Старі messages можуть бути архівовані/деактивовані

**Example:**
```
June: "payment bug" → Backend Bugs topic
July: "payment bug" → Migration Issues topic (after system upgrade)
```

**User Story:**
> Як користувач, я хочу щоб система розуміла що той самий text
> може означати різне в залежності від контексту і часу.

---

### Need 5: Один message → кілька topics

**Requirement:**
- Message може належати до кількох категорій одночасно
- Many-to-many relationship: messages ↔ topics
- Confidence score для кожного зв'язку

**Example:**
```
Message: "iOS app crashes on login after update"
Topics:
├─ iOS (confidence: 0.95)
├─ Authentication (confidence: 0.88)
├─ Backend Bugs (confidence: 0.82)
└─ Urgent (confidence: 0.76)
```

**User Story:**
> Як користувач, я хочу бачити message в різних контекстах,
> бо реальні проблеми часто мають багатовимірний характер.

---

### Need 6: Апрувити витяги, НЕ messages

**Requirement:**
- Human reviews atoms (5 items), NOT messages (100 items)
- High confidence → auto-approve
- Low confidence → human review
- Approval cascades до всіх linked messages

**User Story:**
> Як користувач, я не можу апрувити 1000 messages,
> але я можу переглянути 10 витягів і підтвердити що вони правильні.

---

### Need 7: Спостерігати за трендами, НЕ деталями

**Requirement:**
- Dashboard показує high-level metrics
- Trending topics detection
- Anomaly detection (раптовий ріст issues)
- Time-series visualization

**User Story:**
> Як користувач, я хочу бачити ЩО відбувається в системі (trends),
> а не читати кожен message щоб зрозуміти загальну картину.

---

### Need 8: Швидко знайти релевантне

**Requirement:**
- Semantic search по topics
- Search серед atoms, НЕ messages
- Filter by time window
- Filter by confidence/status

**User Story:**
> Як користувач, я хочу швидко знайти "всі iOS проблеми за останній тиждень",
> і отримати structured results, а не list of raw messages.

---

### Need 9: Виправити помилки системи

**Requirement:**
- Mark message as "irrelevant" (false positive)
- Mark atom as "incorrect" → re-analyze
- System learns from human feedback
- Excluded messages не використовуються в майбутніх аналізах

**User Story:**
> Як користувач, коли я бачу що система помилилася,
> я хочу легко виправити це і щоб система запам'ятала мою корекцію.

---

### Need 10: Розуміти якість даних

**Requirement:**
- Показувати statistics:
  - Скільки messages processed
  - Скільки filtered as noise
  - Signal/noise ratio
- Coverage metrics:
  - % messages with embeddings
  - % messages analyzed
  - % atoms approved

**User Story:**
> Як користувач, я хочу розуміти наскільки добре працює система,
> і чи можу я довіряти її результатам.

---

## 🚫 Anti-Requirements (What User DOESN'T Want)

### ❌ NOT: Message-centric UI

**Bad:**
```
Messages List (100 items):
├─ Message 1: "crash"
├─ Message 2: "thanks"
├─ Message 3: "lol"
...
└─ Message 100: "error"
```

User overwhelmed, can't find signal in noise.

---

### ❌ NOT: Perfect accuracy

**Bad:**
```
System: "I'm 63.7% confident this is relevant, please review"
Human: *spends 5 minutes analyzing*
```

Good enough is enough. False positives/negatives are OK if rare.

---

### ❌ NOT: Manual classification

**Bad:**
```
For each message:
1. Select topic: [dropdown]
2. Select type: [dropdown]
3. Set priority: [dropdown]
4. Click Save
```

This doesn't scale. Must be automatic.

---

### ❌ NOT: Real-time processing requirements

**Bad:**
```
Message arrives → WAIT 3 seconds (embedding generation) → Saved
```

**Good:**
```
Message arrives → Saved immediately → Process later
```

Eventual consistency is OK.

---

### ❌ NOT: Single source of truth per message

**Bad:**
```
Message belongs to ONE topic only
```

**Good:**
```
Message can belong to MULTIPLE topics with confidence scores
```

Reality is multidimensional.

---

## 📐 Success Metrics

### Efficiency Metrics

**Time to Insight:**
- **Current:** 30+ minutes (reading 100 messages)
- **Target:** 5 minutes (reading 5 atoms)
- **Improvement:** 6x faster

**Noise Reduction:**
- **Current:** 100% messages shown (including noise)
- **Target:** 20% signal extracted, 80% noise filtered
- **Improvement:** 5x less information overload

---

### Quality Metrics

**Atom Accuracy:**
- **Target:** >85% atoms correctly extracted
- **Measurement:** Human approval rate

**False Positives:**
- **Target:** <10% atoms marked as irrelevant
- **Measurement:** Drill-down corrections

**Coverage:**
- **Target:** >90% messages processed & scored
- **Measurement:** System statistics

---

### User Satisfaction

**Primary Success Indicator:**
> Користувач НЕ відкриває розділ "Messages" у UI,
> бо всю потрібну інформацію бачить в Dashboard + Atoms.

**Secondary Indicators:**
- User spends <5 min/day на review
- User rarely needs drill-down (< 5% cases)
- User trusts system recommendations (> 80% auto-approve)

---

## 🎭 User Personas

### Persona 1: Product Manager

**Needs:**
- Бачити trending issues
- Знати про critical bugs швидко
- Приоритизувати feature requests

**Use Case:**
```
Opens dashboard → Sees "iOS crashes ↑ 300%"
→ Opens atom → Reads summary
→ Assigns to dev team
```

**Time Spent:** 2 minutes/day

---

### Persona 2: Developer

**Needs:**
- Знати про bugs в своїй зоні
- Розуміти context проблеми
- Іноді потрібен raw data (logs, error messages)

**Use Case:**
```
Dashboard → "Memory leak in worker"
→ Opens atom → Sees 5 occurrences
→ Drill-down → Reads 5 raw messages with stack traces
```

**Time Spent:** 5 minutes when issue assigned

---

### Persona 3: Support Lead

**Needs:**
- Бачити user complaints
- Групувати схожі проблеми
- Відповідати на frequent questions

**Use Case:**
```
Dashboard → "Login issues (10 reports)"
→ Opens atom → Sees common pattern
→ Creates support article
```

**Time Spent:** 10 minutes/week

---

## 🎯 Summary: The Core Principle

**FROM:**
```
1000 messages → Human reads all → Extracts insights manually
```

**TO:**
```
1000 messages → System filters noise → Extracts atoms → Human reviews 20 atoms
```

**Result:**
- 50x less information to process
- 10x faster insight discovery
- Higher quality decisions (less noise = better focus)

---

## 📝 Document Status

- **Version:** 1.0
- **Date:** 2025-10-17
- **Status:** ✅ Approved - Core concept defined
- **Next Step:** Technical architecture design

---

**Це базові потреби користувача без технічних деталей реалізації.**
