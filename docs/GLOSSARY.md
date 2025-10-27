# Documentation Glossary

**Purpose:** Ensure consistent terminology across English and Ukrainian documentation
**Last Updated:** October 26, 2025

## Automation Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Automation | Автоматизація | Feature name | Always capitalize in titles |
| Rule | Правило | Approval rule | Plural: Правила |
| Schedule | Розклад | Cron schedule | Not "Графік" |
| Threshold | Поріг | Approval threshold | Confidence/similarity threshold |
| Version | Версія | Content version | Not "Редакція" |
| Pending | Очікування | Status: not reviewed | As noun, not adjective |
| Auto-approve | Авто-затвердити | Action: auto-approve | Verb form |
| Auto-approved | Авто-затверджено | Past tense | Adjective form |
| Confidence | Впевненість | AI confidence score | 0-100% |
| Similarity | Схожість | Vector similarity | 0-100% |
| Priority | Пріоритет | Rule priority | Lower number = higher priority |
| Job | Завдання | Scheduled job | APScheduler job |
| Worker | Worker | Worker process | Keep in English |
| Trigger | Тригер / Запустити | Action: trigger job | Use "Запустити" for buttons |
| Dashboard | Панель приладів | UI dashboard | Not "Дашборд" |
| Badge | Значок | Notification badge | UI element |
| Notification | Сповіщення | Alert/notification | Email/Telegram |
| Digest | Дайджест | Email digest | Summary email |
| Alert | Попередження / Сповіст | Urgent notification | Depending on context |
| Manual review | Ручна перевірка | Human review needed | Noun phrase |
| False positive | Помилкове позитивне / Помилка | Wrong approval | Use "Помилка" for short form |
| Template | Шаблон | Rule template | Pre-built configuration |
| Preview | Попередній перегляд | Preview feature | See before apply |
| Bulk action | Масова дія / Групова дія | Batch operation | Use "Групова" for UI |

## Technical Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Endpoint | Endpoint | API endpoint | Keep in English |
| Request | Запит | API request | HTTP request |
| Response | Відповідь | API response | HTTP response |
| Status code | Код статусу | HTTP status | 200, 404, 500, etc. |
| Query parameter | Параметр запиту | URL query param | ?param=value |
| Header | Заголовок | HTTP header | Authorization header |
| Token | Токен | Auth token | Bearer token |
| Database | База даних | PostgreSQL DB | Abbreviation: БД |
| Index | Індекс | Database index | SQL index |
| Query | Запит | SQL query | Database query |
| Transaction | Транзакція | DB transaction | ACID properties |
| Cache | Кеш | In-memory cache | Not "Кешування" |
| Log | Журнал | Audit log | Plural: Журнали |
| Error | Помилка | Error message | Generic error |
| Exception | Виняток | Code exception | Programming term |
| Debug | Налагодження | Debugging | Verb: Налагоджувати |

## UI Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Button | Кнопка | UI button | Click button |
| Toggle | Перемикач | Switch control | ON/OFF |
| Slider | Повзунок | Range slider | Drag slider |
| Checkbox | Прапорець | Checkbox input | Select checkbox |
| Dropdown | Розкривне меню | Select dropdown | Choose from dropdown |
| Modal | Модальне вікно | Dialog modal | Popup window |
| Tooltip | Спливаюча підказка | Hover tooltip | Shorter: Підказка |
| Form | Форма | Input form | Fill form |
| Field | Поле | Input field | Text field |
| Placeholder | Заповнювач | Input placeholder | Gray text hint |
| Label | Мітка | Field label | Form label |
| Tab | Вкладка | Navigation tab | Switch tabs |
| Menu | Меню | Navigation menu | Sidebar menu |
| Icon | Іконка | UI icon | Visual symbol |
| Loading | Завантаження | Loading state | Loading spinner |

## Action Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Click | Клацніть | Click button | Imperative |
| Select | Виберіть | Select option | Imperative |
| Enter | Введіть | Enter text | Imperative |
| Save | Зберегти | Save changes | Imperative |
| Cancel | Скасувати | Cancel action | Imperative |
| Delete | Видалити | Delete item | Imperative |
| Edit | Редагувати | Edit content | Imperative |
| Create | Створити | Create new | Imperative |
| Update | Оновити | Update existing | Imperative |
| Refresh | Оновити | Refresh page | Same as Update |
| Download | Завантажити | Download file | Imperative |
| Upload | Вивантажити | Upload file | Imperative |
| Copy | Копіювати | Copy text | Imperative |
| Paste | Вставити | Paste content | Imperative |

## Status Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Active | Активний | Rule active | Boolean state |
| Inactive | Неактивний | Rule inactive | Boolean state |
| Enabled | Увімкнено | Feature enabled | Boolean state |
| Disabled | Вимкнено | Feature disabled | Boolean state |
| Running | Виконується | Job running | Current state |
| Completed | Завершено | Job completed | Past state |
| Failed | Помилка / Не вдалося | Job failed | Error state |
| Paused | Призупинено | Job paused | Temporary stop |
| Scheduled | Запланований | Job scheduled | Future state |
| Success | Успіх | Operation success | Positive outcome |
| Error | Помилка | Operation error | Negative outcome |

## Metric Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Count | Кількість | Version count | Numeric count |
| Rate | Рівень | Approval rate | Percentage |
| Percentage | Відсоток | 50% = 50 відсотків | Use % symbol |
| Average | Середній | Average time | Mean value |
| Total | Всього | Total versions | Sum |
| Minimum | Мінімум | Min threshold | Lowest value |
| Maximum | Максимум | Max threshold | Highest value |
| Threshold | Поріг | Alert threshold | Cutoff value |

## Time Terms

| English | Ukrainian | Context | Notes |
|---------|-----------|---------|-------|
| Daily | Щодня | Daily schedule | Every day |
| Weekly | Щотижня | Weekly digest | Every week |
| Monthly | Щомісяця | Monthly report | Every month |
| Hourly | Щогодини | Hourly job | Every hour |
| Yesterday | Вчора | Yesterday's data | Previous day |
| Today | Сьогодні | Today's stats | Current day |
| Tomorrow | Завтра | Tomorrow's run | Next day |
| Now | Зараз | Run now | Current moment |
| Schedule | Розклад | Cron schedule | Time plan |
| Next run | Наступний запуск | Next execution | Future time |
| Last run | Останній запуск | Previous execution | Past time |

## Usage Guidelines

### Capitalization
- **English:** Capitalize feature names (Automation, Rules)
- **Ukrainian:** Only capitalize at sentence start (автоматизація, правила)

### Plurals
- **English:** Add -s (rules, versions, jobs)
- **Ukrainian:** Vary by gender (правила, версії, завдання)

### Verb Forms
- **English:** Use imperative for instructions (Click, Select, Enter)
- **Ukrainian:** Use imperative 2nd person (Клацніть, Виберіть, Введіть)

### Consistency Checks
When translating, verify:
1. ✅ Term appears in glossary
2. ✅ Translation matches glossary
3. ✅ Context matches usage
4. ✅ Capitalization follows rules
5. ✅ Grammar is correct

---

**Maintained by:** Documentation Team
**Updates:** Add new terms as features are added
**Version:** 1.0 (October 26, 2025)
