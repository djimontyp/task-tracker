# Risk Register

**Продукт:** Pulse Radar
**Статус:** 🟡 Draft
**Дата:** 2025-12-10

---

## Risk Matrix

```
                        IMPACT
            Low         Medium        High        Critical
         ─────────────────────────────────────────────────
    High │           │    R-005    │    R-001   │          │
         │           │             │    R-002   │          │
L        ├───────────┼─────────────┼────────────┼──────────┤
I   Med  │           │    R-006    │    R-003   │          │
K        │           │    R-007    │    R-004   │          │
E        ├───────────┼─────────────┼────────────┼──────────┤
L   Low  │    R-008  │    R-009    │            │          │
I        │           │             │            │          │
H        ├───────────┼─────────────┼────────────┼──────────┤
O   V.Low│           │             │            │          │
O        │           │             │            │          │
D        └───────────┴─────────────┴────────────┴──────────┘

Priority: 🔴 Critical  🟠 High  🟡 Medium  🟢 Low
```

---

## Risk Summary

| ID | Risk | Likelihood | Impact | Priority | Status |
|----|------|------------|--------|----------|--------|
| R-001 | AI extraction quality | High | High | 🔴 | Active |
| R-002 | User adoption | High | High | 🔴 | Active |
| R-003 | Telegram API limits | Medium | High | 🟠 | Monitoring |
| R-004 | OpenAI dependency | Medium | High | 🟠 | Mitigated |
| R-005 | Data privacy concerns | High | Medium | 🟠 | Active |
| R-006 | Performance at scale | Medium | Medium | 🟡 | Monitoring |
| R-007 | Team capacity | Medium | Medium | 🟡 | Active |
| R-008 | Technical debt | Low | Low | 🟢 | Accepted |
| R-009 | Integration failures | Low | Medium | 🟢 | Monitoring |

---

## Detailed Risk Analysis

### R-001: AI Extraction Quality 🔴

**Description:** AI may extract low-quality atoms or miss important information

**Category:** Technical / AI
**Likelihood:** High
**Impact:** High
**Owner:** Tech Lead

**Causes:**
- LLM hallucinations
- Ambiguous messages
- Domain-specific jargon not understood
- Non-English content (Ukrainian)

**Consequences:**
- Users lose trust in system
- More manual review needed
- Defeats purpose of automation

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Human-in-the-loop approval | ✅ Implemented | Done |
| Confidence scores shown | ✅ Implemented | Done |
| Feedback loop for model | 📋 Planned (v1.2) | Medium |
| Domain-specific prompts | 📋 Planned | Low |
| Multi-model ensemble | 🔮 Future | High |

**Monitoring:**
- Track approval rate (target: >80%)
- Track rejection reasons
- Weekly review of extraction quality

**Contingency:**
- If quality drops below 60%, switch to manual extraction temporarily
- Consider fine-tuned model

---

### R-002: User Adoption 🔴

**Description:** Users may not adopt the system or stop using it

**Category:** Business / User
**Likelihood:** High
**Impact:** High
**Owner:** Product Owner

**Causes:**
- Too complex to use
- Not integrated into existing workflow
- Perceived as extra work
- No visible value quickly

**Consequences:**
- System becomes shelfware
- Investment wasted
- Knowledge continues to be lost

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Dashboard first (5-min review) | ✅ Implemented | Done |
| Onboarding flow | 📋 Planned (v1.1) | Medium |
| Weekly summary (value prop) | ✅ Implemented | Done |
| Admin invites team | ✅ Implemented | Done |
| Keyboard shortcuts | 📋 Planned | Low |

**Monitoring:**
- Daily active users (DAU)
- Time spent in app
- Feature usage analytics
- User satisfaction surveys

**Contingency:**
- Personal outreach to inactive users
- Simplify UI based on feedback
- Consider gamification

---

### R-003: Telegram API Limits 🟠

**Description:** Telegram may rate-limit or block bot

**Category:** Technical / External
**Likelihood:** Medium
**Impact:** High
**Owner:** Backend Lead

**Causes:**
- Too many API calls
- Policy violation
- Bot flagged as spam

**Consequences:**
- Message ingestion stops
- Data gaps in knowledge base
- User complaints

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Webhook (not polling) | ✅ Implemented | Done |
| Rate limiting | ✅ Implemented | Done |
| Retry with backoff | ✅ Implemented | Done |
| Multiple bot fallback | 🔮 Future | Medium |
| Queue-based processing | ✅ Implemented (TaskIQ) | Done |

**Monitoring:**
- Telegram API response codes
- Message delivery latency
- Queue depth

**Contingency:**
- Manual message import
- Alternative channel (email)

---

### R-004: OpenAI Dependency 🟠

**Description:** Dependency on OpenAI API for core functionality

**Category:** Technical / Vendor
**Likelihood:** Medium
**Impact:** High
**Owner:** Tech Lead

**Causes:**
- API outage
- Price increase
- Terms of service change
- API deprecation

**Consequences:**
- AI extraction stops
- Increased costs
- Need to migrate quickly

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Ollama support (local LLM) | ✅ Implemented | Done |
| Provider abstraction layer | ✅ Implemented | Done |
| API key encryption | ✅ Implemented | Done |
| Cost monitoring | 📋 Planned | Low |
| Cached responses | 🔮 Future | Medium |

**Monitoring:**
- OpenAI status page
- Cost per day/week
- Response latency

**Contingency:**
- Switch to Ollama within 1 hour
- Consider Azure OpenAI (different SLA)

---

### R-005: Data Privacy Concerns 🟠

**Description:** Users worried about message content being stored/processed

**Category:** Business / Compliance
**Likelihood:** High
**Impact:** Medium
**Owner:** Product Owner

**Causes:**
- Sensitive information in messages
- GDPR/privacy regulations
- Company policy concerns
- OpenAI data usage fears

**Consequences:**
- Users refuse to connect channels
- Compliance issues
- Reputation damage

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Self-hosted option (Ollama) | ✅ Implemented | Done |
| API key encryption | ✅ Implemented | Done |
| Data retention policy | 📋 Planned | Low |
| Privacy policy document | 📋 Planned | Low |
| User consent flow | 📋 Planned | Medium |
| Data export/deletion | 📋 Planned | Medium |

**Monitoring:**
- User feedback on privacy
- Compliance requests

**Contingency:**
- Offer on-premise deployment
- Anonymization option

---

### R-006: Performance at Scale 🟡

**Description:** System may not handle 500+ messages/day efficiently

**Category:** Technical / Performance
**Likelihood:** Medium
**Impact:** Medium
**Owner:** Backend Lead

**Causes:**
- Database queries not optimized
- Embedding computation expensive
- WebSocket connections pile up
- Memory leaks

**Consequences:**
- Slow dashboard loading
- Delayed extraction
- User frustration

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Background task processing | ✅ Implemented (TaskIQ) | Done |
| Database indexes | ✅ Implemented | Done |
| Pagination | ✅ Implemented | Done |
| Caching layer | 📋 Planned | Medium |
| Load testing | 📋 Planned | Medium |

**Monitoring:**
- Response time p95
- Database query time
- Queue processing time
- Memory usage

**Contingency:**
- Horizontal scaling (more workers)
- Query optimization sprint

---

### R-007: Team Capacity 🟡

**Description:** Small team may not keep up with roadmap

**Category:** Resource / Team
**Likelihood:** Medium
**Impact:** Medium
**Owner:** Product Owner

**Causes:**
- Single developer bottleneck
- Competing priorities
- Scope creep
- Technical complexity

**Consequences:**
- Delayed releases
- Technical debt accumulation
- Burnout

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| MVP scope reduced to 8 stories | ✅ Done | Done |
| AI-assisted development (Claude) | ✅ Active | Done |
| Prioritized backlog | ✅ Done | Done |
| Feature flags for partial releases | 📋 Planned | Medium |
| External help for v1.2 | 🔮 Consider | TBD |

**Monitoring:**
- Velocity tracking
- Roadmap progress

**Contingency:**
- Reduce v1.1 scope
- Contract help for specific features

---

### R-008: Technical Debt 🟢

**Description:** Accumulating technical debt may slow future development

**Category:** Technical / Quality
**Likelihood:** Low
**Impact:** Low
**Owner:** Tech Lead

**Causes:**
- Quick fixes for MVP
- Skipped refactoring
- Incomplete tests
- Copy-paste code

**Consequences:**
- Slower feature development
- More bugs
- Harder onboarding

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| TypeScript strict mode | ✅ Implemented | Done |
| mypy strict | ✅ Implemented | Done |
| Code review | ✅ Active | Ongoing |
| Test coverage (80%+) | ✅ Backend (996 tests) | Done |
| Regular refactoring sprints | 📋 Planned | Low |

**Monitoring:**
- Test coverage %
- TypeScript errors
- Code complexity metrics

**Decision:** Accept some debt for MVP speed, address in v1.1

---

### R-009: Integration Failures 🟢

**Description:** Integrations with external systems may break

**Category:** Technical / Integration
**Likelihood:** Low
**Impact:** Medium
**Owner:** Backend Lead

**Causes:**
- API changes without notice
- Network issues
- Authentication failures
- Schema changes

**Consequences:**
- Message ingestion stops
- AI extraction fails
- User-facing errors

**Mitigation Strategies:**

| Strategy | Status | Effort |
|----------|--------|--------|
| Health checks | ✅ Implemented | Done |
| Retry logic | ✅ Implemented | Done |
| Error notifications | 📋 Planned | Low |
| Integration tests | ✅ Partial | Ongoing |
| Circuit breaker pattern | 🔮 Future | Medium |

**Monitoring:**
- Integration health dashboard
- Error rates
- Webhook delivery status

**Contingency:**
- Manual intervention alerts
- Graceful degradation

---

## Risk Response Plan Summary

| Response | Risks | Description |
|----------|-------|-------------|
| **Mitigate** | R-001, R-002, R-005 | Reduce likelihood/impact |
| **Avoid** | - | Change approach to eliminate |
| **Transfer** | R-003, R-004 | Shift to third party (Ollama) |
| **Accept** | R-008 | Acknowledge and monitor |

---

## Risk Review Schedule

| Review | Frequency | Participants |
|--------|-----------|--------------|
| Quick check | Weekly | Tech Lead |
| Full review | Monthly | Team |
| Deep dive | Quarterly | Stakeholders |

---

## Appendix: Risk Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RISK CATEGORIES                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    TECHNICAL                 BUSINESS                  EXTERNAL
    ═════════                 ════════                  ════════

    • AI Quality              • User Adoption           • Telegram API
    • Performance             • Privacy                 • OpenAI API
    • Tech Debt               • Team Capacity           • Regulations
    • Integration             • Scope Creep             • Competition

         │                         │                         │
         └─────────────────────────┴─────────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   RISK MANAGEMENT   │
                        │                     │
                        │  Identify → Assess  │
                        │  → Respond → Monitor│
                        └─────────────────────┘
```

---

**End of BA Documentation Suite**

← [Roadmap](./roadmap.md) | [Home](../README.md)
