# PRD: Admin Workflow

**Version:** 1.0
**Date:** 2025-12-28
**Status:** Draft
**Owner:** maks

## Overview

### Problem Statement

Administrators need to configure, monitor, and troubleshoot the Pulse Radar system. Currently, admin functionality is scattered across Settings and lacks a unified dashboard for system health visibility.

### Solution

A dedicated Admin Panel providing unified access to system configuration, health monitoring, and troubleshooting tools.

### Target Users

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Admin** | System administrator | Configure AI, monitor health, debug issues |
| **DevOps** | Operations engineer | Monitor uptime, check logs, manage providers |

## Admin Responsibilities

Categorized by frequency:

| Frequency | Tasks | UI Pattern |
|-----------|-------|------------|
| **Daily** | Check system health, review extraction quality | Dashboard |
| **Weekly** | Tune thresholds, analyze noise ratios | Analytics |
| **Occasional** | Configure channels, add providers | Forms |
| **Rare** | Debug message extraction, troubleshoot | Debug tools |

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DAILY WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MORNING CHECK (Admin Overview)                               │
│     └── "Is everything running smoothly?"                        │
│         ├── System Status: all services green                    │
│         ├── Extraction Quality: 87% accuracy                     │
│         └── Recent Errors: 2 warnings                            │
│                           │                                      │
│                           ▼                                      │
│  2. INVESTIGATE (if issues found)                                │
│     └── Click on warning/error                                   │
│         ├── See error details                                    │
│         ├── Navigate to affected component                       │
│         └── Take corrective action                               │
│                           │                                      │
│                           ▼                                      │
│  3. OPTIMIZE (weekly)                                            │
│     └── Review extraction metrics                                │
│         ├── Adjust noise thresholds                              │
│         ├── Tune prompts if needed                               │
│         └── Check provider costs                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Access Pattern

### Entry Points

1. **Primary:** Settings → Admin Panel
2. **Shortcut:** `Cmd+Shift+A` (toggle Admin Mode)
3. **Direct URL:** `/settings/admin`

### Admin Mode Behavior

When Admin Mode is active:
- Status badge in header: "Admin Mode"
- Messages appears in sidebar navigation
- Debug overlays available on components
- Additional columns in tables (IDs, scores)

## Features

### AF1: Admin Overview Dashboard

**Priority:** P0 (Must Have)

**Description:**
At-a-glance view of system health, extraction quality, and recent errors.

**Components:**

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| ServiceStatus | Health of all services | `GET /health` |
| ExtractionQuality | Accuracy, precision, recall | `GET /admin/metrics` |
| IngestionStats | Queue depth, processing rate | `GET /admin/ingestion` |
| RecentErrors | Last 5 errors/warnings | `GET /admin/errors` |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel                                 [Exit Admin Mode]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SYSTEM STATUS                                                   │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ ✅ API         │ │ ✅ Worker      │ │ ✅ NATS        │       │
│  │ 99.9% uptime   │ │ 3 active       │ │ Connected      │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ ✅ PostgreSQL  │ │ ⚠️ Ollama      │ │ ✅ Telegram    │       │
│  │ 45 connections │ │ High latency   │ │ 3 channels     │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
│                                                                  │
│  EXTRACTION QUALITY (Last 24h)                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Accuracy: 87%   │   Precision: 92%   │   Recall: 84%    │   │
│  │ ████████░░      │   █████████░       │   ████████░░     │   │
│  │                                                          │   │
│  │ Signal: 145 (72%)   │   Noise: 56 (28%)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  INGESTION PIPELINE                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Queue depth: 12 messages                                  │   │
│  │ Processing: 3.2 msg/min                                   │   │
│  │ ██████████████████░░░░░░░░░░ 65%                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  RECENT ERRORS (3)                                     [View All]│
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ❌ 10:32  Extraction failed: timeout on msg_abc123       │   │
│  │ ⚠️ 09:15  Provider rate limit: OpenAI (retry in 30s)     │   │
│  │ ❌ 08:45  Embedding failed: Ollama not responding        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Dashboard loads in < 2 seconds
- [ ] All service statuses visible at a glance
- [ ] Extraction metrics update every 30 seconds
- [ ] Errors clickable to view details
- [ ] Visual indicators: green (ok), yellow (warning), red (error)

---

### AF2: LLM Provider Management

**Priority:** P0 (Must Have)

**Description:**
Configure and manage LLM providers (OpenAI, Ollama) for knowledge extraction.

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel > Providers                        [+ Add Provider] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔷 OpenAI                                   ✅ Connected  │   │
│  │ GPT-4, GPT-3.5-turbo                                      │   │
│  │ Usage: $12.45 this month  │  1,234 calls                  │   │
│  │ Default: ✓ Classification  ✓ Extraction                   │   │
│  │                                     [Test] [Edit] [Delete] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🦙 Ollama (Local)                           ⚠️ Slow       │   │
│  │ llama3.2, mistral                                         │   │
│  │ Usage: Free  │  567 calls  │  Avg: 2.3s                   │   │
│  │ Default: □ Classification  □ Extraction                   │   │
│  │                                     [Test] [Edit] [Delete] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Add provider with API key (encrypted storage)
- [ ] Test connection before saving
- [ ] Show available models per provider
- [ ] Assign provider to task type (classification, extraction, embedding)
- [ ] Show usage statistics

---

### AF3: Telegram Channel Configuration

**Priority:** P0 (Must Have)

**Description:**
Configure Telegram channels/groups as data sources for knowledge extraction.

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel > Channels                         [+ Add Channel]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💬 Frontend Team                            ✅ Active     │   │
│  │ @frontend_team_chat                                       │   │
│  │ Messages: 1,234  │  Last sync: 2 min ago                  │   │
│  │ Atoms extracted: 89  │  Signal ratio: 72%                 │   │
│  │                                    [Pause] [Edit] [Remove] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💬 Backend Engineers                        ✅ Active     │   │
│  │ @backend_eng                                              │   │
│  │ Messages: 856  │  Last sync: 5 min ago                    │   │
│  │ Atoms extracted: 67  │  Signal ratio: 68%                 │   │
│  │                                    [Pause] [Edit] [Remove] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💬 Mobile Dev                               ⏸️ Paused     │   │
│  │ @mobile_dev_chat                                          │   │
│  │ Messages: 432  │  Paused since: 3 days ago                │   │
│  │                                   [Resume] [Edit] [Remove] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Add channel by username or invite link
- [ ] Test connection (bot has access)
- [ ] Show message count and sync status
- [ ] Pause/resume ingestion per channel
- [ ] Show signal ratio per channel

---

### AF4: Extraction Tuning

**Priority:** P1 (Should Have)

**Description:**
Fine-tune knowledge extraction quality through prompt editing and threshold adjustment.

**Components:**

| Component | Purpose |
|-----------|---------|
| PromptEditor | Edit extraction prompts |
| ThresholdSliders | Adjust noise/signal thresholds |
| PreviewPanel | Test extraction on sample messages |
| QualityMetrics | Show before/after comparison |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel > Extraction Tuning                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THRESHOLDS                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Noise Threshold:  0.25 ────●──────────── 0.50            │   │
│  │ Signal Threshold: 0.65 ──────────●────── 0.90            │   │
│  │                                                          │   │
│  │ Preview: With current settings:                          │   │
│  │ • 145 messages → Signal (72%)                            │   │
│  │ • 56 messages → Noise (28%)                              │   │
│  │                                    [Reset] [Apply]        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  EXTRACTION PROMPT                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ You are a knowledge extraction assistant.                 │   │
│  │ Analyze the following message and extract:                │   │
│  │ - Problems being discussed                                │   │
│  │ - Decisions being made                                    │   │
│  │ - Insights or learnings                                   │   │
│  │ ...                                                       │   │
│  │                                                          │   │
│  │                                   [Test] [Save] [Revert]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TEST EXTRACTION                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Sample message: [Select or paste...]                      │   │
│  │                                                          │   │
│  │ Result:                                                   │   │
│  │ ⚠️ Problem: "Memory leak in background task"              │   │
│  │ Confidence: 0.87                                          │   │
│  │ Topic: Mobile                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Edit prompts with syntax highlighting
- [ ] Adjust thresholds with immediate preview
- [ ] Test extraction on sample messages
- [ ] Compare before/after metrics
- [ ] Revert to previous version

---

### AF5: Messages Debug (Hidden Layer)

**Priority:** P2 (Nice to Have)

**Description:**
Access raw messages for debugging extraction issues. This is the "hidden layer" only visible to admins.

**Access:** Only visible when Admin Mode is active

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel > Messages Debug                                    │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Signal ▼] [Noise ▼] [Failed ▼]    Search...  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ msg_abc123                                 📊 Score: 0.72 │   │
│  │ From: @frontend_team_chat  │  2 hours ago                 │   │
│  │ Classification: SIGNAL                                    │   │
│  │                                                          │   │
│  │ "We decided to use JWT for mobile authentication.        │   │
│  │ This aligns with our security requirements..."           │   │
│  │                                                          │   │
│  │ SCORING BREAKDOWN:                                        │   │
│  │ ├─ Decision keywords: +0.3                               │   │
│  │ ├─ Technical terms: +0.2                                 │   │
│  │ ├─ Message length: +0.1                                  │   │
│  │ └─ Author reputation: +0.12                              │   │
│  │                                                          │   │
│  │ EXTRACTED ATOMS:                                          │   │
│  │ └─ 💡 Decision: "Use JWT for mobile auth" (0.92)         │   │
│  │                                                          │   │
│  │                            [Re-extract] [Mark as Training] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ msg_def456                                 📊 Score: 0.18 │   │
│  │ From: @backend_eng  │  3 hours ago                        │   │
│  │ Classification: NOISE                                     │   │
│  │                                                          │   │
│  │ "ok, sounds good 👍"                                      │   │
│  │                                                          │   │
│  │ SCORING BREAKDOWN:                                        │   │
│  │ ├─ Short message: -0.3                                   │   │
│  │ ├─ No technical terms: -0.2                              │   │
│  │ └─ Acknowledgment pattern: -0.32                         │   │
│  │                                                          │   │
│  │ No atoms extracted (below threshold)                      │   │
│  │                            [Re-extract] [Mark as Training] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Filter by classification (signal/noise/failed)
- [ ] Show scoring breakdown for each message
- [ ] Show extracted atoms (if any)
- [ ] Re-extract button to retry extraction
- [ ] Mark as training data for model improvement

---

## Technical Requirements

### API Endpoints Needed

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /admin/health` | System health summary | ⚠️ New |
| `GET /admin/metrics` | Extraction quality metrics | ⚠️ New |
| `GET /admin/errors` | Recent errors list | ⚠️ New |
| `GET /admin/ingestion` | Ingestion pipeline stats | ⚠️ New |
| `GET /providers` | List providers | ✅ Exists |
| `POST /providers/:id/test` | Test provider connection | ✅ Exists |
| `GET /messages` | List messages (admin only) | ✅ Exists |
| `POST /messages/:id/re-extract` | Re-extract message | ⚠️ New |

### Frontend Components Needed

| Component | Location | Status |
|-----------|----------|--------|
| AdminOverview | `/settings/admin` | ⚠️ New |
| ServiceStatusCard | AdminOverview | ⚠️ New |
| ExtractionQualityCard | AdminOverview | ⚠️ New |
| IngestionStatsCard | AdminOverview | ⚠️ New |
| RecentErrorsList | AdminOverview | ⚠️ New |
| ProviderList | `/settings/providers` | ✅ Exists |
| ChannelList | `/settings/channels` | ⚠️ New |
| ExtractionTuning | `/settings/extraction` | ⚠️ New |
| MessagesDebug | `/settings/messages` | ⚠️ Refactor |

### Role-Based Access Control

```typescript
// Admin check utility
const isAdmin = (user: User) => user.role === 'admin';

// Route guard
<Route
  path="/settings/admin"
  element={isAdmin(user) ? <AdminPanel /> : <Navigate to="/" />}
/>

// Sidebar visibility
{isAdminMode && <NavItem to="/messages" icon={MessageSquare} />}
```

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to diagnose issue | < 5 minutes | From alert to root cause |
| Provider setup time | < 2 minutes | From click to connected |
| False positive rate | < 10% | Noise classified as signal |
| Admin satisfaction | > 4/5 stars | In-app feedback |

---

## Out of Scope (v1)

- User management (roles, permissions)
- Audit logging
- Multi-tenant configuration
- Backup/restore functionality
- Custom dashboard widgets

---

## Related Documents

- [[user-stories#Admin Stories]] — US-101 to US-108
- [[entity-hierarchy]] — Messages as hidden layer
- [[roles#Admin]] — Admin permissions
- [[../knowledge-discovery]] — End User PRD

---

## Open Questions

1. **Admin Notifications:** Should admins be alerted on critical errors (Slack, email)?
2. **Threshold Presets:** Offer preset configurations (conservative, balanced, aggressive)?
3. **Training Data:** How to use marked training data for model improvement?
4. **Multi-Admin:** How to handle concurrent configuration changes?
