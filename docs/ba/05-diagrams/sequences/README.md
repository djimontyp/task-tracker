# Sequence Diagrams

**Продукт:** Pulse Radar
**Статус:** Draft
**Дата:** 2025-12-11

---

## Overview

Технічні діаграми послідовності для 6 основних flows системи.
Показують взаємодію компонентів: Browser, API, Services, Database, External Systems.

| # | Diagram | Description | Participants |
|---|---------|-------------|--------------|
| 1 | [Daily Review](01-daily-review.md) | Dashboard metrics loading | Browser, API, MetricsBroadcaster, DB, WebSocket |
| 2 | [Atom Approval](02-atom-approval.md) | Approve/Reject atoms | Browser, API, AtomCRUD, DB, WebSocket, NATS |
| 3 | [Weekly Report](03-weekly-report.md) | Activity aggregation | Browser, API, ActivityService, DB |
| 4 | [Knowledge Search](04-knowledge-search.md) | Semantic search | Browser, API, SemanticSearch, OpenAI, pgvector |
| 5 | [User Invitation](05-user-invitation.md) | Create/link users | Browser, API, UserCRUD, DB, TelegramProfile |
| 6 | [Telegram Setup](06-telegram-setup.md) | Webhook configuration | Browser, API, TelegramService, Telegram API, NATS |

---

## Legend

### Arrow Types

```
──────►     Synchronous request/call
◄──────     Synchronous response

─ ─ ─ ►     Asynchronous / background operation
◄ ─ ─ ─     Async callback

══════►     WebSocket / NATS broadcast
◄══════     WebSocket subscription
```

### Participant Types

```
┌─────────┐
│ Browser │     React SPA (Dashboard)
└────┬────┘

┌─────────┐
│   API   │     FastAPI endpoints
└────┬────┘

┌─────────┐
│ Service │     Business logic layer
└────┬────┘

┌─────────┐
│   DB    │     PostgreSQL + pgvector
└────┬────┘

┌─────────┐
│   WS    │     WebSocket Manager
└────┬────┘

┌─────────┐
│  NATS   │     JetStream message broker
└────┬────┘

┌─────────┐
│External │     Telegram API, OpenAI, etc.
└────┬────┘
```

### Annotations

```
[1]         Step number
(200)       HTTP status code
{JSON}      Request/response body
<async>     Async operation marker
[error]     Error handling branch
~100ms      Latency annotation
```

---

## Related Documentation

- [User Flows](../flows/README.md) — User-centric flow diagrams
- [Context Diagram](../context-diagram.md) — System architecture
- [Data Dictionary](../../02-data-dictionary.md) — Entity definitions
- [Business Rules](../../04-requirements/business-rules.md) — BR-xxx rules

---

**Next:** [Daily Review Sequence](01-daily-review.md)
