# Feature Specification: Telegram Integration UI

**Feature Branch**: `004-telegram-integration-ui`
**Created**: 2025-12-13
**Status**: Draft
**Related**: US-033, UC-033
**Input**: User description: "US-033: Telegram Integration UI - інтерфейс налаштування Telegram каналів в Settings, щоб адміни могли підключати канали для інгесту повідомлень"

## Context

Pulse Radar — AI-система збору знань з комунікаційних каналів. Telegram є першим (і пріоритетним) джерелом повідомлень. Адміністратори потребують інтерфейсу для підключення Telegram-каналів до системи.

**Backend готовність:**
- Webhook endpoint (`/webhook/telegram`) вже існує
- TelegramIngestionService реалізовано
- Telegram Bot створено (@PulseRadarBot)

**Що потрібно:** Frontend UI в Settings для налаштування webhook URL та моніторингу підключених каналів.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Telegram Setup (Priority: P1)

Як адміністратор, я хочу налаштувати webhook URL для Telegram бота, щоб повідомлення з каналів автоматично надходили до Pulse Radar.

**Why this priority**: Без налаштованого webhook неможливо отримувати повідомлення з Telegram. Це фундаментальна функціональність для всієї системи інгесту.

**Independent Test**: Може бути протестовано шляхом відкриття Settings → Integrations → Telegram, заповнення форми та перевірки статусу підключення. Після успішного налаштування бот повинен отримувати повідомлення.

**Acceptance Scenarios**:

1. **Given** адмін відкриває Settings → Integrations → Telegram вперше, **When** сторінка завантажується, **Then** відображається wizard з трьома кроками: Bot Info → Configure Webhook → Verify Connection

2. **Given** адмін на кроці "Configure Webhook", **When** він заповнює protocol (https) та host (pulse.example.com) і натискає "Save", **Then** система реєструє webhook URL в Telegram API та показує статус "Connected"

3. **Given** webhook успішно налаштовано, **When** хтось пише в підключений Telegram-канал, **Then** повідомлення з'являється в Messages page

---

### User Story 2 - View Connection Status (Priority: P1)

Як адміністратор, я хочу бачити поточний статус Telegram інтеграції, щоб знати чи система працює коректно.

**Why this priority**: Адмін повинен розуміти стан інтеграції без необхідності тестувати вручну.

**Independent Test**: Після налаштування webhook, повернення на сторінку Telegram Integration показує актуальний статус з датою останнього отриманого повідомлення.

**Acceptance Scenarios**:

1. **Given** webhook налаштовано, **When** адмін відкриває сторінку Telegram Integration, **Then** він бачить: bot username, webhook URL, статус (Connected/Disconnected), час останнього повідомлення

2. **Given** webhook URL недоступний (сервер offline), **When** адмін відкриває сторінку, **Then** статус показує "Disconnected" або "Error" з описом проблеми

---

### User Story 3 - Verify Connection Manually (Priority: P2)

Як адміністратор, я хочу мати можливість вручну перевірити підключення, щоб переконатися що webhook працює після змін інфраструктури.

**Why this priority**: Корисно для troubleshooting, але не критично для базової функціональності.

**Independent Test**: Натискання кнопки "Test Connection" відправляє тестовий запит і показує результат.

**Acceptance Scenarios**:

1. **Given** webhook налаштовано, **When** адмін натискає "Test Connection", **Then** система перевіряє зв'язок з Telegram API та показує результат (success/failure з деталями)

---

### User Story 4 - Update Webhook Configuration (Priority: P2)

Як адміністратор, я хочу змінити webhook URL (наприклад, при зміні домену), щоб інтеграція продовжувала працювати.

**Why this priority**: Зміна домену — рідка операція, але повинна бути можливою.

**Independent Test**: Зміна host в налаштуваннях і збереження оновлює webhook в Telegram API.

**Acceptance Scenarios**:

1. **Given** webhook вже налаштовано на pulse.example.com, **When** адмін змінює host на new-pulse.example.com і зберігає, **Then** система оновлює webhook URL в Telegram API та показує новий URL

---

### User Story 5 - View Connected Channels (Priority: P3)

Як адміністратор, я хочу бачити список каналів, з яких надходять повідомлення, щоб контролювати джерела даних.

**Why this priority**: Інформаційна функція, не критична для роботи системи.

**Independent Test**: Після отримання повідомлень з різних каналів, список показує всі унікальні джерела.

**Acceptance Scenarios**:

1. **Given** система отримала повідомлення з 3 різних каналів, **When** адмін відкриває сторінку Telegram Integration, **Then** він бачить список каналів з назвами та кількістю повідомлень

---

### Edge Cases

- Що відбувається якщо Telegram API недоступний під час збереження webhook? → Показати помилку з пропозицією повторити пізніше
- Що відбувається якщо host не є публічно доступним? → Telegram API поверне помилку "URL host is not valid", показати це користувачу з поясненням
- Що відбувається якщо бота не додано як адміна каналу? → Webhook працюватиме, але повідомлення не надходитимуть; показати попередження про необхідність перевірки прав бота
- Що відбувається при подвійному натисканні "Save"? → Заблокувати кнопку під час запиту, показати loading state

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current Telegram integration status (connected, disconnected, error) on the Telegram settings page
- **FR-002**: System MUST allow administrators to configure webhook URL by entering protocol (https) and host
- **FR-003**: System MUST validate that the protocol is HTTPS before allowing save (HTTP not allowed for production)
- **FR-004**: System MUST register the webhook URL with Telegram API when administrator saves the configuration
- **FR-005**: System MUST display the bot username (@PulseRadarBot) to help administrators add it to their channels
- **FR-006**: System MUST show clear error messages when webhook registration fails, including the reason from Telegram API
- **FR-007**: System MUST persist webhook configuration so it survives system restarts
- **FR-008**: System MUST provide a "Test Connection" button to verify the webhook is working
- **FR-009**: System MUST display the last received message timestamp to confirm active ingestion
- **FR-010**: System MUST show a list of channels that have sent messages (discovered through ingestion)
- **FR-011**: System MUST display step-by-step instructions for adding the bot to Telegram channels

### Key Entities

- **TelegramWebhookConfig**: Represents the webhook configuration with protocol, host, webhook_url, is_active status, bot_username, set_at timestamp
- **Source**: Represents a Telegram channel from which messages are received; includes telegram_chat_id, channel title, message count
- **TelegramProfile**: Represents a Telegram user who sent messages; linked to messages for author tracking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can complete initial Telegram webhook setup in under 3 minutes
- **SC-002**: Connection status reflects actual webhook health with 95% accuracy (tested by comparing status to actual message delivery)
- **SC-003**: 90% of administrators successfully configure webhook on first attempt without external help
- **SC-004**: System displays webhook configuration changes within 5 seconds of saving
- **SC-005**: Error messages are actionable — 80% of common errors include specific remediation steps

## Assumptions

- Telegram Bot (@PulseRadarBot) is already created and bot token is configured in environment variables
- Backend webhook endpoint (`/webhook/telegram`) is already implemented and functional
- Backend API endpoints for webhook settings are fully implemented:
  - `GET /api/v1/webhook-settings` - Get current configuration with defaults
  - `POST /api/v1/webhook-settings` - Save configuration (without activating)
  - `POST /api/v1/webhook-settings/telegram/set` - Activate webhook in Telegram API
  - `DELETE /api/v1/webhook-settings/telegram` - Deactivate webhook
  - `GET /api/v1/webhook-settings/telegram/info` - Get live webhook info from Telegram API
  - `POST /api/v1/webhook-settings/telegram/groups` - Add group to tracking
  - `DELETE /api/v1/webhook-settings/telegram/groups/{group_id}` - Remove group
  - `POST /api/v1/webhook-settings/telegram/groups/refresh-names` - Refresh group names
- Only HTTPS webhook URLs are accepted (Telegram requirement for production)
- Administrators have access to add the bot to their Telegram channels with admin permissions
