# Phase 6: Export + API - Task Breakdown

**Duration:** 2 weeks
**Goal:** Build export functionality and API documentation
**Dependencies:** Phase 4 + 5 (all features must be complete)

---

## Task Organization

**Total Tasks:** 14
**Estimated Time:** 80 hours (2 weeks × 40 hours)

---

## Export UI Tasks (4 tasks, 24 hours)

### Task 6.1: Create Export Page

**Time:** 8h | **Agent:** react-frontend-architect | **Priority:** Critical

**Description:** New page for batch export functionality.

**Implementation:**
```tsx
// Route: /export
// Accessible from: Settings → Export, or Topics → Export button
// Layout:
//   - Header: "Export Knowledge"
//   - Filter section: select topics to export
//   - Format selector: Markdown | JSON | API
//   - Preview section: sample output
//   - Export button: triggers download
```

**Acceptance:**
- [ ] Export page accessible from Settings and Topics
- [ ] Page shows all exportable topics with checkboxes
- [ ] Format selector with 3 options (Markdown, JSON, API)
- [ ] Preview shows sample output for selected format
- [ ] Export button triggers download

---

### Task 6.2: Add Format Selector

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Radio buttons for export format selection.

**Implementation:**
```tsx
// shadcn RadioGroup component
// Options:
//   - Markdown (.md): "Human-readable format for documentation"
//   - JSON (.json): "Machine-readable format for integrations"
//   - API: "Generate API key and endpoint URL"
// Preview updates when format changes
```

**Acceptance:**
- [ ] Radio buttons for 3 formats
- [ ] Help text explains each format
- [ ] Preview updates on format change
- [ ] Default: Markdown

---

### Task 6.3: Add Batch Export (Multiple Topics)

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Select multiple topics for export.

**Implementation:**
```tsx
// Checkboxes for each topic
// "Select All" checkbox
// Shows selected count: "5 topics selected"
// Bulk export creates ZIP file with multiple files
```

**Acceptance:**
- [ ] Checkboxes for all topics
- [ ] "Select All" selects all topics
- [ ] Shows selected count
- [ ] Export creates ZIP file (if multiple topics)
- [ ] Single topic → single file (no ZIP)

---

### Task 6.4: Add Export Preview

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Preview pane showing sample export output.

**Implementation:**
```tsx
// Split view:
//   - Left: topic selector + format selector
//   - Right: preview pane (read-only code editor)
// Preview shows first 50 lines of export
// Syntax highlighting for Markdown/JSON
// "View Full Export" button opens in new tab
```

**Acceptance:**
- [ ] Preview shows sample output (first 50 lines)
- [ ] Syntax highlighting for Markdown/JSON
- [ ] Updates when selection or format changes
- [ ] "View Full Export" button works

---

## Export Backend Tasks (3 tasks, 18 hours)

### Task 6.5: Create Export API Endpoint

**Time:** 6h | **Agent:** fastapi-backend-expert | **Priority:** Critical

**Description:** Unified endpoint for exporting topics.

**Implementation:**
```python
# POST /api/export
# Body: {
#   "topic_ids": [1, 2, 3],
#   "format": "markdown",  # or "json"
#   "options": {
#     "include_messages": true,
#     "include_embeddings": false
#   }
# }
# Response: file download (application/zip or text/markdown or application/json)
```

**Acceptance:**
- [ ] Accepts array of topic IDs
- [ ] Supports Markdown and JSON formats
- [ ] Options for including messages, embeddings
- [ ] Returns ZIP if multiple topics, single file if one topic
- [ ] Rate limited (max 50 topics per request)

---

### Task 6.6: Generate Markdown Export Format

**Time:** 6h | **Agent:** fastapi-backend-expert | **Priority:** High

**Description:** Markdown formatter for topics (extends Task 4.12).

**Implementation:**
```python
# Template:
# # {topic_name}
# {topic_description}
#
# ## Atoms ({atom_count})
# ### {atom_name}
# {atom_content}
#
# #### Messages ({message_count})
# - {message_text} ({timestamp})
#
# ## Related Topics
# - [{related_topic_name}](#{related_topic_id})
```

**Acceptance:**
- [ ] Markdown follows template structure
- [ ] All atoms included with messages
- [ ] Related topics linked
- [ ] Valid Markdown syntax
- [ ] UTF-8 encoding (handles emojis)

---

### Task 6.7: Generate JSON Export Format

**Time:** 6h | **Agent:** fastapi-backend-expert | **Priority:** Medium

**Description:** JSON formatter for topics (extends Task 4.13).

**Implementation:**
```python
# Schema:
{
  "topics": [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "...",
      "atoms": [
        {
          "id": 10,
          "name": "Feature X",
          "messages": [
            { "id": 100, "text": "...", "timestamp": "..." }
          ]
        }
      ],
      "relationships": [
        { "topic_id": 2, "similarity": 0.85 }
      ]
    }
  ]
}
```

**Acceptance:**
- [ ] JSON follows schema
- [ ] All nested data included
- [ ] Valid JSON (parseable)
- [ ] UTF-8 encoding

---

## API Documentation Tasks (4 tasks, 22 hours)

### Task 6.8: Create API Documentation Page

**Time:** 8h | **Agent:** documentation-expert + react-frontend-architect | **Priority:** High

**Description:** Page documenting all RESTful API endpoints.

**Implementation:**
```tsx
// Route: /api/docs
// Layout:
//   - Sidebar: list of endpoint categories (Topics, Messages, Analysis, Export)
//   - Main: endpoint details (method, URL, params, response)
//   - Code examples: curl, JavaScript fetch, Python requests
// Interactive: "Try It" button to test endpoints
```

**Acceptance:**
- [ ] All endpoints documented (GET, POST, PUT, DELETE)
- [ ] Sidebar navigation by category
- [ ] Code examples for curl, JS, Python
- [ ] "Try It" button opens interactive tester
- [ ] Response examples (success + error cases)

---

### Task 6.9: Add curl Examples for All Endpoints

**Time:** 6h | **Agent:** documentation-expert | **Priority:** High

**Description:** Curl command examples for each endpoint.

**Implementation:**
```bash
# Example:
curl -X POST https://api.tasktracker.app/export \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_ids": [1, 2, 3],
    "format": "markdown"
  }' \
  -o export.zip
```

**Acceptance:**
- [ ] Curl example for every endpoint
- [ ] Examples show authentication (API key)
- [ ] Examples show request body (if applicable)
- [ ] Examples show output file handling
- [ ] Copyable (click to copy button)

---

### Task 6.10: Add Authentication Documentation

**Time:** 4h | **Agent:** fastapi-backend-expert + documentation-expert | **Priority:** High

**Description:** Document API authentication (API keys).

**Implementation:**
```markdown
## Authentication

All API requests require an API key.

### Generating an API Key
1. Go to Settings → Admin Tools → API Keys
2. Click "Generate New Key"
3. Copy the key (shown once only)

### Using Your API Key
Include the key in the Authorization header:
`Authorization: Bearer YOUR_API_KEY`

### Key Permissions
- Read-only: View topics, messages, atoms
- Write: Create topics, approve proposals
- Admin: Trigger analysis runs, bulk operations
```

**Acceptance:**
- [ ] Explains how to generate API key
- [ ] Shows header format
- [ ] Documents key permissions (read, write, admin)
- [ ] Security best practices (don't commit keys)

---

### Task 6.11: Add Rate Limiting Documentation

**Time:** 4h | **Agent:** fastapi-backend-expert + documentation-expert | **Priority:** Medium

**Description:** Document API rate limits and quotas.

**Implementation:**
```markdown
## Rate Limits

- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- Admin: 1000 requests/minute

Rate limit headers:
- `X-RateLimit-Limit`: requests per minute
- `X-RateLimit-Remaining`: remaining requests
- `X-RateLimit-Reset`: timestamp when limit resets

Export endpoint: max 50 topics per request
```

**Acceptance:**
- [ ] Documents rate limits by user type
- [ ] Shows rate limit headers
- [ ] Explains export quota (50 topics max)
- [ ] Error response example (429 Too Many Requests)

---

## Settings Pages Tasks (3 tasks, 16 hours)

### Task 6.12: Create Settings → Knowledge Sources Page

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Page to manage knowledge sources (Telegram, future integrations).

**Implementation:**
```tsx
// Route: /settings/knowledge-sources
// Shows:
//   - Connected sources: Telegram (with status badge)
//   - Future sources: Slack (coming soon), Email (coming soon)
// Telegram card:
//   - Status: Connected (green badge)
//   - Last sync: 2 minutes ago
//   - Actions: Disconnect, Configure
```

**Acceptance:**
- [ ] Shows Telegram as connected source
- [ ] Status badge (connected/disconnected)
- [ ] Last sync timestamp
- [ ] Placeholder cards for future sources (grayed out)
- [ ] Disconnect button (with confirmation)

---

### Task 6.13: Create Settings → Admin Tools Page

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Admin-only settings (model configs, API keys, feature flags).

**Implementation:**
```tsx
// Route: /settings/admin-tools
// Visible only when isAdminMode=true
// Sections:
//   - Model Configuration (LLM provider, model name, temperature)
//   - API Keys (generate, revoke, list)
//   - Feature Flags (toggle experimental features)
// Each section expandable/collapsible
```

**Acceptance:**
- [ ] Page hidden when `isAdminMode=false`
- [ ] Model Configuration section shows current settings
- [ ] API Keys section allows generate/revoke
- [ ] Feature Flags section lists all flags with toggles
- [ ] Changes require confirmation

---

### Task 6.14: Hide Admin Tools from Non-Admin Users

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Implement feature flag check for Admin Tools.

**Implementation:**
```tsx
// In Settings navigation:
if (isAdminMode) {
  return (
    <>
      <SettingsNavLink to="/settings/general">General</SettingsNavLink>
      <SettingsNavLink to="/settings/knowledge-sources">Knowledge Sources</SettingsNavLink>
      <SettingsNavLink to="/settings/admin-tools">Admin Tools</SettingsNavLink>
    </>
  );
} else {
  return (
    <>
      <SettingsNavLink to="/settings/general">General</SettingsNavLink>
      <SettingsNavLink to="/settings/knowledge-sources">Knowledge Sources</SettingsNavLink>
    </>
  );
}

// Route guard for /settings/admin-tools:
// If not admin, redirect to /settings/general
```

**Acceptance:**
- [ ] Admin Tools link hidden when `isAdminMode=false`
- [ ] Direct URL access blocked (redirect to general)
- [ ] Admin Tools page shows 403 error if accessed by non-admin
- [ ] Feature flag check on both frontend and backend

---

## Phase 6 Summary

**Total Tasks:** 14 (Export UI: 4, Export Backend: 3, API Docs: 4, Settings: 3)
**Total Time:** 80 hours (2 weeks)

**Critical Path:**
1. Task 6.1 (Export page) → Blocks Task 6.2-6.4 (export UI)
2. Task 6.5 (Export API) → Blocks Task 6.6-6.7 (formatters)
3. Task 6.8 (API docs page) → Blocks Task 6.9-6.11 (documentation)
4. Task 6.12-6.13 (Settings pages) → Blocks Task 6.14 (feature flag)

**Parallel Opportunities:**
- Export UI (6.1-6.4) parallel to Export Backend (6.5-6.7)
- API Documentation (6.8-6.11) parallel to Settings Pages (6.12-6.14)

**Dependencies:**
- Phase 4 (Topics export functionality)
- Phase 5 (Analysis runs export)
- All previous phases complete (this is final integration)

**Phase Completion Criteria:**
- [ ] All 14 tasks complete
- [ ] Can export 5 topics as Markdown (ZIP file)
- [ ] API documentation page shows all endpoints
- [ ] Settings → Knowledge Sources shows Telegram
- [ ] Settings → Admin Tools hidden for non-admin users

---

## Epic Completion

**After Phase 6:**
- [ ] All 6 phases complete (77 total tasks)
- [ ] ADR-0001 fully implemented
- [ ] Admin Panel toggle (Cmd+Shift+A) works
- [ ] Consumer UI ready for Phase 2 transition
- [ ] Feature flag (localStorage → backend roles) ready to switch

**Final Demo Checklist:**
1. Toggle Admin Mode on/off (Cmd+Shift+A)
2. Bulk approve 10 topics (Admin Panel)
3. Inspect message classification (Message Inspect modal)
4. View Topics in grid/list (Consumer UI)
5. Trigger analysis run (Admin tab)
6. Export 5 topics as Markdown
7. View API documentation

**Success Metrics:**
- Navigation sections: 6 → 3 (50% reduction)
- Admin features separated from consumer UI
- Zero breaking changes during Phase 1 → Phase 2 transition
- Feature flag coverage: 100%

---

**Epic Status:** Complete
**Next Steps:** Phase 2 transition planning (hide Admin Panel for consumers)
