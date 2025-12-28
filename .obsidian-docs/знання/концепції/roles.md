---
type: knowledge
created: 2025-12-28
status: validated
tags:
  - concept
  - roles
  - permissions
  - core
---

# User Roles

> **Status:** Validated with user (2025-12-28)

## Overview

Pulse Radar has two main roles with clear separation of concerns:

| Role | Focus | Access Level |
|------|-------|--------------|
| **End User** | Knowledge consumption & validation | Read + Approve/Reject |
| **Admin** | System configuration & debugging | Full access |

## End User

### Primary Goals

1. **Discover knowledge** — "What's new today?"
2. **Validate extractions** — Approve/reject pending atoms
3. **Browse by topic** — Navigate organized knowledge
4. **Search** — Find specific information

### Access Matrix

| Resource | Can View | Can Create | Can Edit | Can Delete |
|----------|----------|------------|----------|------------|
| Dashboard | ✅ | — | — | — |
| Topics | ✅ | ❌ | ❌ | ❌ |
| Atoms | ✅ | ❌ | Approve/Reject | ❌ |
| Messages | ❌ | ❌ | ❌ | ❌ |
| Providers | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ (General only) | — | Theme, Language | — |

### UI Visibility

```
SIDEBAR:
├─ Dashboard ✅
├─ Topics ✅
├─ Atoms ✅
├─ Search ✅
├─ Executive Summary ✅
└─ Settings ✅ (limited)

HIDDEN:
├─ Messages ❌
├─ Providers ❌
├─ Prompts ❌
├─ Analysis Runs ❌
└─ System Health ❌
```

---

## Admin

### Primary Goals

1. **All End User goals** — same workflow
2. **Configure AI** — Providers, prompts, thresholds
3. **Debug issues** — Messages, extraction logs
4. **Monitor health** — System status, job queues

### Access Matrix

| Resource | Can View | Can Create | Can Edit | Can Delete |
|----------|----------|------------|----------|------------|
| Dashboard | ✅ | — | — | — |
| Topics | ✅ | ✅ | ✅ | ✅ |
| Atoms | ✅ | ✅ | ✅ | ✅ |
| Messages | ✅ | ✅ | ✅ | ✅ |
| Providers | ✅ | ✅ | ✅ | ✅ |
| Prompts | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ (Full) | — | All | — |

### UI Visibility

```
SIDEBAR (all End User items +):
├─ Messages ✅ (debug)
├─ Providers ✅
├─ Agents ✅
└─ System Health ✅ (future)

SETTINGS TABS:
├─ General ✅
├─ Sources ✅
├─ Providers ✅
└─ Prompt Tuning ✅
```

---

## Admin Mode Toggle

**Activation:**
- Keyboard: `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Windows/Linux)
- Settings → General → Admin Mode toggle

**Behavior:**
- Shows/hides admin-only UI elements
- Enables additional actions (bulk delete, force re-extract)
- Shows debug information on cards

**Persistence:**
- Saved in localStorage
- Persists across sessions

---

## Future: Multi-User Organization

For enterprise deployments:

### Proposed Roles

| Role | Description |
|------|-------------|
| **Viewer** | Read-only access to knowledge |
| **Contributor** | End User + can create atoms manually |
| **Manager** | Contributor + can manage topics |
| **Admin** | Full system access |
| **Owner** | Admin + billing, user management |

### RBAC Model

```
Permission Sets:
├─ knowledge.read
├─ knowledge.approve
├─ knowledge.create
├─ knowledge.delete
├─ topics.manage
├─ messages.debug
├─ providers.configure
├─ prompts.edit
├─ users.manage
└─ billing.access
```

---

## UI Implications

### For End User

1. **Clean interface** — no admin clutter
2. **Focus on value** — atoms & topics front and center
3. **Simple actions** — approve, reject, search
4. **No configuration** — system "just works"

### For Admin

1. **Power tools available** — but not intrusive
2. **Debug access** — when things go wrong
3. **Configuration** — tune AI behavior
4. **Monitoring** — system health visible

---

## Related

- [[entity-hierarchy]] — what each role accesses
- [[user-journey]] — how each role uses the system
