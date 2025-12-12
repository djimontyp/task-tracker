# Stakeholders — Зацікавлені сторони

**Продукт:** Pulse Radar
**Статус:** ✅ Approved (Q8-Q10 узгоджено)
**Дата:** 2025-12-10

---

## Overview

**Організація:** Компанія з декількома проєктами
**Загальна кількість користувачів:** 40
**Team size:** 5-10 людей на проєкт
**PM-ів:** 2-3 (один на проєкт)
**Admin model:** PM = Admin (немає окремої ролі)
**Onboarding:** Invite-only

---

## Stakeholder Map

```
                    ┌─────────────────────────────────────┐
                    │           PULSE RADAR               │
                    └─────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   EXECUTIVE   │          │   MANAGERS    │          │    USERS      │
│   SPONSORS    │          │               │          │               │
├───────────────┤          ├───────────────┤          ├───────────────┤
│ • CEO/CTO     │          │ • PM          │          │ • Developers  │
│ • Product     │          │ • Team Lead   │          │ • Designers   │
│   Owner       │          │               │          │ • QA          │
└───────────────┘          └───────────────┘          └───────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
   Strategic                   Operational                   Daily Use
   Decisions                   Oversight                     & Feedback
```

---

## Detailed Stakeholder Analysis

### 1. Executive Sponsors

#### CEO / CTO (Максим)

| Attribute | Value |
|-----------|-------|
| **Role** | Executive decision maker |
| **Interest** | High-level visibility, ROI |
| **Influence** | High |
| **Engagement** | Low frequency, high impact |

**Needs:**
- Weekly/monthly summaries of team activity
- Key decisions та blockers at a glance
- Metrics: productivity trends, knowledge coverage

**Success Criteria:**
- "Бачу pulse команди за 2 хвилини"
- "Знаю про blockers раніше ніж вони стають критичними"

**Pain Points без Pulse Radar:**
- Не читає всі канали
- Дізнається про проблеми запізно
- Немає структурованого огляду

---

#### Product Owner

| Attribute | Value |
|-----------|-------|
| **Role** | Product direction, priorities |
| **Interest** | Feature adoption, user feedback |
| **Influence** | High |
| **Engagement** | Medium frequency |

**Needs:**
- User feedback aggregation
- Feature request tracking
- Decision history

**Success Criteria:**
- "Бачу всі product-related рішення в одному місці"
- "Швидко знаходжу контекст минулих обговорень"

---

### 2. Managers

#### Project Manager (Олена)

| Attribute | Value |
|-----------|-------|
| **Role** | Project delivery, team coordination |
| **Interest** | Task visibility, blockers, progress |
| **Influence** | Medium-High |
| **Engagement** | Daily |

**Needs:**
- Daily review → Dashboard (5 хв замість 30)
- Tasks та blockers з усіх каналів
- Пошук "що вирішили вчора?"

**Success Criteria:**
- "Не пропускаю важливу інформацію"
- "Знаю стан проєкту без читання 500+ повідомлень"

**Pain Points без Pulse Radar:**
- 500+ повідомлень/день
- Губить важливу інформацію
- 1 година на morning sync

---

#### Team Lead

| Attribute | Value |
|-----------|-------|
| **Role** | Technical decisions, team support |
| **Interest** | Technical decisions, problems |
| **Influence** | Medium |
| **Engagement** | Daily |

**Needs:**
- Technical decisions history
- Problem tracking
- Knowledge base для onboarding

**Success Criteria:**
- "Швидко знаходжу чому щось було вирішено так"
- "Новий член команди може зрозуміти контекст"

---

### 3. End Users

#### Developer

| Attribute | Value |
|-----------|-------|
| **Role** | Implementation, technical work |
| **Interest** | Context, decisions, requirements |
| **Influence** | Low |
| **Engagement** | As needed |

**Needs:**
- Search: "що вирішили про API?"
- Context минулих рішень
- Requirements з обговорень

**Success Criteria:**
- "Знаходжу потрібну інформацію за 30 секунд"
- "Не питаю те, що вже обговорювалось"

---

#### Designer / QA

| Attribute | Value |
|-----------|-------|
| **Role** | Specialized domain work |
| **Interest** | Domain-specific decisions |
| **Influence** | Low |
| **Engagement** | As needed |

**Needs:**
- Domain-filtered view (UI decisions, bugs)
- Topic-based navigation

---

## RACI Matrix

| Activity | CEO/CTO | PO | PM | TL | Dev |
|----------|:-------:|:--:|:--:|:--:|:---:|
| Strategic decisions | **A** | R | C | I | I |
| Feature priorities | C | **A** | R | C | I |
| Daily monitoring | I | I | **A/R** | R | I |
| Knowledge search | I | C | C | R | **R** |
| System configuration | I | I | C | **A** | I |
| Feedback & improvements | C | **A** | R | R | R |

**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## Stakeholder Communication Plan

| Stakeholder | Channel | Frequency | Content |
|-------------|---------|-----------|---------|
| CEO/CTO | Dashboard summary | Weekly | Key metrics, blockers |
| Product Owner | Dashboard + Search | Daily | Feedback, decisions |
| PM | Dashboard | Daily | All activity, tasks |
| Team Lead | Dashboard + Search | Daily | Technical items |
| Developer | Search | As needed | Context, decisions |

---

## Interest vs Influence Matrix

```
           High Influence
                 │
    ┌────────────┼────────────┐
    │            │            │
    │  KEEP      │   MANAGE   │
    │  SATISFIED │   CLOSELY  │
    │            │            │
    │            │   CEO/CTO  │
    │            │   PO       │
    │            │   PM       │
Low ├────────────┼────────────┤ High
Int │            │            │ Interest
    │            │            │
    │  MONITOR   │   KEEP     │
    │  (minimal  │   INFORMED │
    │   effort)  │            │
    │            │   Dev, QA  │
    │            │   Designer │
    │            │   TL       │
    └────────────┼────────────┘
                 │
           Low Influence
```

**Manage Closely (High Influence, High Interest):**
- CEO/CTO, PO, PM
- Regular updates, involve in key decisions

**Keep Informed (Low Influence, High Interest):**
- Developers, QA, Designers, Team Leads
- Access to system, respond to questions

---

## Закриті питання

| # | Питання | Рішення |
|---|---------|---------|
| Q8 | Скільки PM-ів? | 2-3 PM (один на проєкт) |
| Q9 | Admin role? | PM = Admin (немає окремої ролі) |
| Q10 | Onboarding? | Invite-only (PM/Admin запрошує) |

---

**Next:** [User Stories](./04-requirements/user-stories.md)
