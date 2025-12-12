# Product Roadmap

**Продукт:** Pulse Radar
**Статус:** 🟢 Approved
**Дата:** 2025-12-11
**Baseline:** December 2025

---

## Timeline

| Version | Target Date | Status | Duration |
|---------|-------------|--------|----------|
| **MVP (v1.0)** | December 2025 | 🟢 Done | - |
| **v1.1** | February 2026 | 📋 Planned | 8 weeks |
| **v1.2** | April 2026 | 📋 Planned | 8 weeks |
| **v2.0** | June 2026+ | 🔮 Future | TBD |

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PULSE RADAR ROADMAP                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    MVP (v1.0)                v1.1                    v1.2                   Future
    Dec 2025                  Feb 2026                Apr 2026               Jun 2026+
    ══════════               ═════                   ═════                  ══════
        │                      │                       │                       │
        │  Core Platform       │  Enhanced UX          │  Advanced AI          │  Scale
        │                      │                       │                       │
        ▼                      ▼                       ▼                       ▼
    ┌───────────┐         ┌───────────┐          ┌───────────┐          ┌───────────┐
    │• Dashboard │         │• WebSocket │          │• Semantic  │          │• Slack     │
    │• Messages  │         │• Topic Nav │          │  Search    │          │• Multi-org │
    │• Atoms     │         │• Cross-proj│          │• Scoring   │          │• API v2    │
    │• Search    │         │• Decision  │          │• Auto-     │          │• Mobile    │
    │• Admin     │         │  Context   │          │  approve   │          │            │
    │• Telegram  │         │            │          │            │          │            │
    └───────────┘         └───────────┘          └───────────┘          └───────────┘
        │                      │                       │                       │
    ────┼──────────────────────┼───────────────────────┼───────────────────────┼────►
        │                      │                       │                       │
    Dec 2025               Feb 2026                Apr 2026                Jun 2026+
      DONE                  8 weeks                 8 weeks                  TBD
```

---

## MVP (v1.0) — Core Platform

**Status:** 🟢 Development Complete (11/31 features verified)
**Goal:** Функціональна платформа для 40 користувачів

### Features

| ID | Feature | Story | Status |
|----|---------|-------|--------|
| F001 | Telegram Ingestion | US-033 | ✅ Done |
| F002 | Message Management | US-002 | ✅ Done |
| F003 | AI Extraction | US-003 | ✅ Done |
| F004 | Topic Management | - | ✅ Done |
| F005 | Atom Management | US-003 | ✅ Done |
| F006 | Dashboard | US-001 | ✅ Done |
| F008 | LLM Providers | US-031 | ✅ Done |
| F019 | Health Monitoring | - | ✅ Done |
| F026 | Background Tasks | - | ✅ Done |
| F030 | Settings | - | ✅ Done |
| F031 | shadcn Theme | - | ✅ Done |

### MVP Scope (8 User Stories)

| Priority | Stories | Focus |
|----------|---------|-------|
| Must | US-001, US-002, US-003 | Daily Review |
| Must | US-010 | Weekly Summary |
| Must | US-020 | Search |
| Must | US-030, US-031, US-033 | Admin Setup |

### Success Criteria

- [ ] 40 users can login and use system
- [ ] Telegram messages flow into dashboard
- [ ] AI extracts atoms automatically
- [ ] PM can review atoms in < 5 min/day
- [ ] CTO can generate weekly summary
- [ ] System handles 500+ messages/day

---

## v1.1 — Enhanced UX

**Goal:** Real-time updates, better navigation, decision context

### Features

| ID | Feature | Story | Priority |
|----|---------|-------|----------|
| F010 | WebSocket Updates | - | Should |
| F011 | Topic Navigation | US-004 | Should |
| F012 | Cross-Project View | US-011 | Should |
| F013 | Decision Context | US-022 | Should |
| F014 | Quick Start Guide | US-041 | Should |

### User Stories

| Story | Description | Priority |
|-------|-------------|----------|
| US-004 | Topic Navigation | Should |
| US-011 | Cross-Project View | Should |
| US-022 | Decision Context | Should |
| US-041 | Quick Start | Should |

### Key Improvements

1. **Real-time WebSocket**
   - Dashboard updates without refresh
   - New message notifications
   - Live extraction progress

2. **Topic Navigation**
   - Browse atoms by topic
   - Topic dashboard with metrics
   - Auto-topic suggestions

3. **Decision Context**
   - See full discussion thread
   - Participants in decision
   - Related atoms linked

4. **Cross-Project View**
   - Compare activity across projects
   - Identify patterns
   - Resource bottlenecks

### Success Criteria

- [ ] Dashboard updates in real-time
- [ ] Users can navigate by topics effectively
- [ ] CTO can compare projects at a glance
- [ ] Decision context improves understanding

---

## v1.2 — Advanced AI

**Goal:** Semantic search, scoring calibration, automation

### Features

| ID | Feature | Story | Priority |
|----|---------|-------|----------|
| F015 | Semantic Search | US-021 | Could |
| F016 | Scoring Calibration | - | Could |
| F017 | Auto-Approve Rules | - | Could |
| F018 | Noise Filter 2.0 | - | Could |

### User Stories

| Story | Description | Priority |
|-------|-------------|----------|
| US-021 | Semantic Search | Won't (MVP) → v1.2 |
| US-032 | Topic Management | Should |
| US-040 | First-Time Guide | Could |

### Key Improvements

1. **Semantic Search**
   - Search by meaning, not just keywords
   - "database issues" → finds "PostgreSQL problems"
   - Relevance ranking

2. **Scoring Calibration**
   - Per-team thresholds
   - Feedback loop from approvals
   - Model fine-tuning

3. **Automation Rules**
   - Auto-approve high-confidence atoms
   - Auto-assign to topics
   - Scheduled digests

### Success Criteria

- [ ] Search finds semantically related content
- [ ] Scoring accuracy improves with feedback
- [ ] Less manual approval needed (auto-approve)

---

## Future — Scale

**Goal:** Multi-channel, enterprise features

### Features (Backlog)

| ID | Feature | Description |
|----|---------|-------------|
| F020 | Slack Integration | Second messenger |
| F021 | Multi-Organization | SaaS model |
| F022 | API v2 | Public API |
| F023 | Mobile App | iOS/Android |
| F024 | SSO/SAML | Enterprise auth |
| F025 | Audit Log | Compliance |

### Considerations

- **Slack**: Similar webhook model, different API
- **Multi-org**: Tenant isolation, billing
- **Mobile**: React Native or PWA
- **Enterprise**: SOC2, GDPR compliance

---

## Release Strategy

### MVP Launch

```
Phase 1: Internal Alpha
├── 5 internal users
├── Daily feedback
└── Bug fixing

Phase 2: Closed Beta
├── 20 invited users
├── Weekly surveys
└── Feature prioritization

Phase 3: Production
├── 40 target users
├── Monitoring
└── Support process
```

### Version Release Cadence

| Version | Type | Frequency |
|---------|------|-----------|
| v1.0.x | Patch | As needed (bugs) |
| v1.1.0 | Minor | +2 months |
| v1.2.0 | Minor | +4 months |
| v2.0.0 | Major | TBD |

---

## Dependencies

### External Dependencies

| Dependency | Version | Risk | Mitigation |
|------------|---------|------|------------|
| OpenAI API | GPT-4 | API changes | Ollama fallback |
| Telegram API | Bot API 7.x | Rate limits | Queue + retry |
| PostgreSQL | 15 | Stable | pgvector tested |
| React | 18.x | Stable | LTS supported |

### Internal Dependencies

```
F001 (Telegram) ──► F002 (Messages) ──► F003 (Extraction)
                                              │
                                              ▼
F006 (Dashboard) ◄──────────────────── F005 (Atoms)
       │
       ▼
F008 (LLM) ──────► F003 (Extraction)
```

---

## Metrics & KPIs

### MVP Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Daily Active Users | 20 | - |
| Messages/Day | 500+ | - |
| Atoms Extracted/Day | 50+ | - |
| Approval Rate | >80% | - |
| Time to Review (PM) | <5 min | - |

### v1.1 Success Metrics

| Metric | Target |
|--------|--------|
| Real-time Latency | <1 sec |
| Topic Usage | >50% atoms tagged |
| Cross-project Views | 5/week |

### v1.2 Success Metrics

| Metric | Target |
|--------|--------|
| Search Relevance | >90% |
| Auto-approve Rate | 30% |
| Scoring Accuracy | 85%+ |

---

## Roadmap Visualization (Gantt-style)

```
                    Month 1   Month 2   Month 3   Month 4   Month 5   Month 6
                    ════════  ════════  ════════  ════════  ════════  ════════

MVP (v1.0)          ████████
  Dashboard         ████
  Messages          ████
  Atoms             ████
  Search             ██████
  Admin              ██████
  Telegram          ████

v1.1                          ████████████████
  WebSocket                     ██████
  Topic Nav                       ████████
  Cross-Project                     ████████
  Decision Context                    ██████

v1.2                                            ████████████████
  Semantic Search                                 ████████
  Scoring                                           ████████
  Auto-approve                                        ████████

                    ▲
                    │
                  NOW
```

---

**Next:** [Risk Register](./risks.md)
