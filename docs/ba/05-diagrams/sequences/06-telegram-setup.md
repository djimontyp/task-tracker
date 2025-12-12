# Sequence: Telegram Setup

**Flow:** Telegram Setup
**Actor:** Admin (PM)
**Related Use Case:** UC-033
**Related User Flow:** [Telegram Setup](../flows/README.md#flow-6-telegram-setup)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| TelegramWebhookService | Python | Webhook management |
| Telegram API | External | Bot API |
| DB | PostgreSQL | Configuration storage |
| NATS | JetStream | Async tasks |
| Worker | TaskIQ | Background processing |

---

## Sequence Diagram: Configure Webhook

```
┌─────────┐       ┌─────────┐       ┌──────────────────┐       ┌───────────────┐       ┌─────────┐
│ Browser │       │   API   │       │TelegramWebhook   │       │ Telegram API  │       │   DB    │
│         │       │         │       │    Service       │       │               │       │         │
└────┬────┘       └────┬────┘       └────────┬─────────┘       └───────┬───────┘       └────┬────┘
     │                 │                     │                         │                    │
     │  [1] Admin opens Settings → Integrations → Telegram             │                    │
     │                 │                     │                         │                    │
     │  GET /api/v1/webhook-settings/telegram/info                     │                    │
     │────────────────►│                     │                         │                    │
     │                 │                     │                         │                    │
     │                 │  SELECT * FROM telegram_webhook_config        │                    │
     │                 │───────────────────────────────────────────────────────────────────►│
     │                 │◄───────────────────────────────────────────────────────────────────│
     │                 │  (current config or null)                     │                    │
     │                 │                     │                         │                    │
     │◄────────────────│                     │                         │                    │
     │  (200) {        │                     │                         │                    │
     │    bot_username: "@PulseRadarBot",    │                         │                    │
     │    webhook_url: null,                 │                         │                    │
     │    is_active: false                   │                         │                    │
     │  }              │                     │                         │                    │
     │                 │                     │                         │                    │
     │                 │                     │                         │                    │
     │  [2] Admin fills form:                │                         │                    │
     │  Protocol: https │                    │                         │                    │
     │  Host: pulse.example.com              │                         │                    │
     │                 │                     │                         │                    │
     │  POST /api/v1/webhook-settings/telegram/set                     │                    │
     │  {protocol: "https", host: "pulse.example.com"}                 │                    │
     │────────────────►│                     │                         │                    │
     │                 │                     │                         │                    │
     │                 │  [3] Construct webhook URL                    │                    │
     │                 │  url = "https://pulse.example.com/webhook/telegram"               │
     │                 │                     │                         │                    │
     │                 │  [4] set_webhook(url)                         │                    │
     │                 │────────────────────►│                         │                    │
     │                 │                     │                         │                    │
     │                 │                     │  [5] POST setWebhook    │                    │
     │                 │                     │  https://api.telegram.org/bot{TOKEN}/setWebhook
     │                 │                     │  {                      │                    │
     │                 │                     │    url: "https://pulse.example.com/webhook/telegram"
     │                 │                     │  }                      │                    │
     │                 │                     │─────────────────────────►                    │
     │                 │                     │                         │                    │
     │                 │                     │                         │  ~300ms            │
     │                 │                     │                         │                    │
     │                 │                     │◄─────────────────────────                    │
     │                 │                     │  {ok: true, result: true}│                    │
     │                 │                     │                         │                    │
     │                 │◄────────────────────│                         │                    │
     │                 │  (webhook set OK)   │                         │                    │
     │                 │                     │                         │                    │
     │                 │  [6] Save config to DB                        │                    │
     │                 │  INSERT/UPDATE telegram_webhook_config        │                    │
     │                 │  (webhook_url, is_active=true, protocol, host)│                    │
     │                 │───────────────────────────────────────────────────────────────────►│
     │                 │◄───────────────────────────────────────────────────────────────────│
     │                 │                     │                         │                    │
     │◄────────────────│                     │                         │                    │
     │  (200) {        │                     │                         │                    │
     │    status: "connected",               │                         │                    │
     │    webhook_url: "https://...",        │                         │                    │
     │    bot_username: "@PulseRadarBot"     │                         │                    │
     │  }              │                     │                         │                    │
     │                 │                     │                         │                    │
     │  [7] Show success: "Channel connected!"                         │                    │
     │                 │                     │                         │                    │
     ▼                 ▼                     ▼                         ▼                    ▼
```

---

## Sequence Diagram: Message Ingestion (After Setup)

```
┌───────────────┐       ┌─────────┐       ┌──────────────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│ Telegram API  │       │   API   │       │TelegramIngestion │       │   DB    │       │  NATS   │       │   WS    │
│               │       │         │       │    Service       │       │         │       │         │       │         │
└───────┬───────┘       └────┬────┘       └────────┬─────────┘       └────┬────┘       └────┬────┘       └────┬────┘
        │                    │                     │                      │                 │                 │
        │  [1] New message in channel              │                      │                 │                 │
        │  POST /webhook/telegram                  │                      │                 │                 │
        │  {                  │                    │                      │                 │                 │
        │    update_id: 123456,                    │                      │                 │                 │
        │    message: {       │                    │                      │                 │                 │
        │      message_id: 789,                    │                      │                 │                 │
        │      chat: {id: -100123, title: "#team"},│                      │                 │                 │
        │      from: {id: 111, username: "john"},  │                      │                 │                 │
        │      text: "Let's migrate to PostgreSQL" │                      │                 │                 │
        │    }               │                     │                      │                 │                 │
        │  }                 │                     │                      │                 │                 │
        │───────────────────►│                     │                      │                 │                 │
        │                    │                     │                      │                 │                 │
        │                    │  [2] process_update(update)                │                 │                 │
        │                    │────────────────────►│                      │                 │                 │
        │                    │                     │                      │                 │                 │
        │                    │                     │  [3] Find/create source                │                 │
        │                    │                     │  SELECT * FROM sources WHERE           │                 │
        │                    │                     │  telegram_chat_id = -100123            │                 │
        │                    │                     │────────────────────────►               │                 │
        │                    │                     │◄────────────────────────               │                 │
        │                    │                     │  (source or create new)│               │                 │
        │                    │                     │                      │                 │                 │
        │                    │                     │  [4] Find/create telegram_profile      │                 │
        │                    │                     │  SELECT * FROM telegram_profiles       │                 │
        │                    │                     │  WHERE telegram_user_id = 111          │                 │
        │                    │                     │────────────────────────►               │                 │
        │                    │                     │◄────────────────────────               │                 │
        │                    │                     │  (profile or create new)               │                 │
        │                    │                     │                      │                 │                 │
        │                    │                     │  [5] INSERT message   │                 │                 │
        │                    │                     │  (content, source_id, telegram_profile_id,               │
        │                    │                     │   telegram_message_id, sent_at)        │                 │
        │                    │                     │────────────────────────►               │                 │
        │                    │                     │◄────────────────────────               │                 │
        │                    │                     │  (message_id: uuid-new)│               │                 │
        │                    │                     │                      │                 │                 │
        │                    │                     │  [6] Publish to NATS  │                 │                 │
        │                    │                     │  telegram.message.received              │                 │
        │                    │                     │─────────────────────────────────────────►               │
        │                    │                     │                      │                 │                 │
        │                    │                     │  [7] Broadcast WS    │                 │                 │
        │                    │                     │  {type: "ingestion.progress"}          │                 │
        │                    │                     │──────────────────────────────────────────────────────────►
        │                    │                     │                      │                 │                 │
        │                    │◄────────────────────│                      │                 │                 │
        │                    │  (processed OK)     │                      │                 │                 │
        │                    │                     │                      │                 │                 │
        │◄───────────────────│                     │                      │                 │                 │
        │  (200) OK          │                     │                      │                 │                 │
        │                    │                     │                      │                 │                 │
        ▼                    ▼                     ▼                      ▼                 ▼                 ▼
```

---

## Sequence Diagram: Background Processing (Worker)

```
┌─────────┐       ┌──────────────────┐       ┌─────────────────┐       ┌─────────┐       ┌─────────┐
│  NATS   │       │    TaskIQ        │       │ ScoringService  │       │   DB    │       │   WS    │
│         │       │    Worker        │       │                 │       │         │       │         │
└────┬────┘       └────────┬─────────┘       └────────┬────────┘       └────┬────┘       └────┬────┘
     │                     │                          │                     │                 │
     │  [1] telegram.message.received                 │                     │                 │
     │  {message_id: uuid} │                          │                     │                 │
     │────────────────────►│                          │                     │                 │
     │                     │                          │                     │                 │
     │                     │  [2] score_message_task(message_id)            │                 │
     │                     │─────────────────────────►│                     │                 │
     │                     │                          │                     │                 │
     │                     │                          │  [3] Load message   │                 │
     │                     │                          │  SELECT * FROM messages WHERE id = uuid
     │                     │                          │─────────────────────►                 │
     │                     │                          │◄─────────────────────                 │
     │                     │                          │                     │                 │
     │                     │                          │  [4] Calculate importance_score      │
     │                     │                          │  - content_analysis (40%)            │
     │                     │                          │  - author_score (20%)                │
     │                     │                          │  - context_score (20%)               │
     │                     │                          │  - urgency_score (20%)               │
     │                     │                          │                     │                 │
     │                     │                          │  [5] Classify: signal/noise          │
     │                     │                          │  IF score >= 0.7 THEN signal         │
     │                     │                          │  ELSE IF score >= 0.3 THEN weak_signal
     │                     │                          │  ELSE noise         │                 │
     │                     │                          │                     │                 │
     │                     │                          │  [6] UPDATE message │                 │
     │                     │                          │  SET importance_score = 0.82,        │
     │                     │                          │      noise_classification = 'signal',│
     │                     │                          │      analysis_status = 'analyzed'    │
     │                     │                          │─────────────────────►                 │
     │                     │                          │◄─────────────────────                 │
     │                     │                          │                     │                 │
     │                     │                          │  [7] Broadcast scored│                │
     │                     │                          │  {type: "message_scored"}            │
     │                     │                          │──────────────────────────────────────►
     │                     │                          │                     │                 │
     │                     │◄─────────────────────────│                     │                 │
     │                     │  (task completed)        │                     │                 │
     │                     │                          │                     │                 │
     │                     │  [8] Check threshold     │                     │                 │
     │                     │  IF unprocessed >= 10 messages                 │                 │
     │                     │  THEN trigger extract_knowledge               │                 │
     │                     │                          │                     │                 │
     ▼                     ▼                          ▼                     ▼                 ▼
```

---

## Data Flow

### Request: POST /api/v1/webhook-settings/telegram/set

```json
{
  "protocol": "https",
  "host": "pulse.example.com"
}
```

### Response: WebhookSetupResponse

```json
{
  "status": "connected",
  "webhook_url": "https://pulse.example.com/webhook/telegram",
  "bot_username": "@PulseRadarBot",
  "bot_id": 123456789,
  "is_active": true,
  "set_at": "2025-01-15T10:00:00Z"
}
```

### Telegram Webhook Update (Incoming)

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 456,
    "date": 1705312800,
    "chat": {
      "id": -1001234567890,
      "title": "#project-team",
      "type": "supergroup"
    },
    "from": {
      "id": 111222333,
      "is_bot": false,
      "first_name": "John",
      "username": "johndev"
    },
    "text": "Let's migrate to PostgreSQL for better vector support"
  }
}
```

### WebSocket Event: ingestion.progress

```json
{
  "type": "ingestion.progress",
  "topic": "ingestion",
  "data": {
    "source": "#project-team",
    "processed": 1,
    "total": 1,
    "message_id": "uuid-new"
  },
  "timestamp": "2025-01-15T10:00:01Z"
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-050 | Webhook URL must use HTTPS in production |
| BR-051 | Bot must have read permission in channel |
| BR-052 | Each message creates telegram_profile if new |
| BR-053 | Scoring threshold: >= 0.7 signal, >= 0.3 weak_signal |
| BR-054 | Auto-extraction triggers at 10+ unprocessed messages |

---

## Error Handling

```
[Error: Telegram API rejected webhook]
     │
     │  (400) {error: "Telegram returned: URL host is not valid"}
     │  Suggestion: Check host is publicly accessible
     │
[Error: Bot not admin in channel]
     │
     │  Webhook set OK, but messages won't arrive
     │  Admin must add @PulseRadarBot to channel admins
     │
[Error: Invalid update format]
     │
     │  Log error, return (200) to Telegram
     │  (prevents Telegram from retrying bad updates)
     │
[Error: Database connection failed]
     │
     │  Queue message in NATS for retry
     │  Return (200) to acknowledge receipt
```

---

## Configuration

```python
# Environment variables
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_SECRET=random-secret-for-verification

# Webhook verification (optional security)
X-Telegram-Bot-Api-Secret-Token: {TELEGRAM_WEBHOOK_SECRET}
```

---

## Retry Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE RETRY FLOW                        │
│                                                              │
│  Telegram → API → Failed? → NATS Dead Letter Queue          │
│                      │                                       │
│                      ▼                                       │
│            Retry after: 1s, 5s, 30s, 5min                   │
│                      │                                       │
│                      ▼                                       │
│            Max retries: 5                                    │
│                      │                                       │
│                      ▼                                       │
│            After max: Move to failed_messages table         │
│            Alert: Slack notification to admin               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Back to:** [Sequence Diagrams Index](README.md)
