# Sequence: User Invitation

**Flow:** User Invitation
**Actor:** Admin (PM)
**Related Use Case:** UC-030
**Related User Flow:** [User Invitation](../flows/README.md#flow-5-user-invitation)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| UserCRUD | Python | User management |
| DB | PostgreSQL | Data storage |
| EmailService | Python | Invitation emails |

---

## Sequence Diagram: Create User

```
┌─────────┐          ┌─────────┐          ┌──────────┐          ┌─────────┐
│ Browser │          │   API   │          │ UserCRUD │          │   DB    │
└────┬────┘          └────┬────┘          └────┬─────┘          └────┬────┘
     │                    │                    │                     │
     │  [1] Admin opens Settings → Users       │                     │
     │  GET /api/v1/users │                    │                     │
     │───────────────────►│                    │                     │
     │                    │                    │                     │
     │                    │  SELECT * FROM users                     │
     │                    │───────────────────────────────────────────►
     │                    │◄───────────────────────────────────────────
     │                    │                    │                     │
     │◄───────────────────│                    │                     │
     │  (200) [user list] │                    │                     │
     │                    │                    │                     │
     │                    │                    │                     │
     │  [2] Click "Invite User"                │                     │
     │  Fill form: name, email, role           │                     │
     │                    │                    │                     │
     │  POST /api/v1/users│                    │                     │
     │  {                 │                    │                     │
     │    first_name: "John",                  │                     │
     │    last_name: "Developer",              │                     │
     │    email: "john@company.com",           │                     │
     │    role: "member"  │                    │                     │
     │  }                 │                    │                     │
     │───────────────────►│                    │                     │
     │                    │                    │                     │
     │                    │  [3] Validate email unique               │
     │                    │  SELECT * FROM users WHERE email = ...   │
     │                    │───────────────────────────────────────────►
     │                    │◄───────────────────────────────────────────
     │                    │  (no duplicate)    │                     │
     │                    │                    │                     │
     │                    │  [4] create_user() │                     │
     │                    │───────────────────►│                     │
     │                    │                    │                     │
     │                    │                    │  [5] INSERT INTO users
     │                    │                    │  (first_name, last_name, email, role,
     │                    │                    │   created_at, is_active)
     │                    │                    │  RETURNING id      │
     │                    │                    │─────────────────────►
     │                    │                    │◄─────────────────────
     │                    │                    │  (user_id: uuid-new)│
     │                    │                    │                     │
     │                    │◄───────────────────│                     │
     │                    │  User object       │                     │
     │                    │                    │                     │
     │◄───────────────────│                    │                     │
     │  (201) {           │                    │                     │
     │    id: "uuid-new", │                    │                     │
     │    first_name: "John",                  │                     │
     │    email: "john@company.com",           │                     │
     │    role: "member", │                    │                     │
     │    is_active: true │                    │                     │
     │  }                 │                    │                     │
     │                    │                    │                     │
     │  [6] Show toast: "User created"         │                     │
     │  Refresh user list │                    │                     │
     │                    │                    │                     │
     ▼                    ▼                    ▼                     ▼
```

---

## Sequence Diagram: Link Telegram Profile

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Browser │          │   API   │          │   DB    │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │  [1] Admin selects user "John"          │
     │  Sees: "Telegram: Not linked"           │
     │                    │                    │
     │  [2] Enter Telegram username: @johndev  │
     │                    │                    │
     │  POST /api/v1/users/{user_id}/link-telegram
     │  {telegram_user_id: 123456789}          │
     │───────────────────►│                    │
     │                    │                    │
     │                    │  [3] Verify user exists
     │                    │  SELECT * FROM users WHERE id = user_id
     │                    │───────────────────────►
     │                    │◄───────────────────────
     │                    │  (user found)      │
     │                    │                    │
     │                    │  [4] Verify telegram_profile exists
     │                    │  SELECT * FROM telegram_profiles
     │                    │  WHERE telegram_user_id = 123456789
     │                    │───────────────────────►
     │                    │◄───────────────────────
     │                    │  (profile found)   │
     │                    │                    │
     │                    │  [5] Check not already linked to different user
     │                    │  (profile.user_id IS NULL OR = user_id)
     │                    │                    │
     │                    │  [6] UPDATE telegram_profiles
     │                    │  SET user_id = {user_id}
     │                    │  WHERE telegram_user_id = 123456789
     │                    │───────────────────────►
     │                    │◄───────────────────────
     │                    │  (1 row updated)   │
     │                    │                    │
     │◄───────────────────│                    │
     │  (200) {           │                    │
     │    status: "linked",                    │
     │    user_id: "uuid",│                    │
     │    telegram_user_id: 123456789,         │
     │    telegram_username: "@johndev"        │
     │  }                 │                    │
     │                    │                    │
     │  [7] Update UI: "Telegram: @johndev"    │
     │                    │                    │
     ▼                    ▼                    ▼
```

---

## Data Flow

### Request: POST /api/v1/users

```json
{
  "first_name": "John",
  "last_name": "Developer",
  "email": "john@company.com",
  "phone": "+380501234567",
  "avatar_url": null,
  "role": "member"
}
```

### Response: UserResponse

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Developer",
  "email": "john@company.com",
  "phone": "+380501234567",
  "avatar_url": null,
  "role": "member",
  "is_active": true,
  "telegram_profile": null,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### Request: POST /api/v1/users/{user_id}/link-telegram

```json
{
  "telegram_user_id": 123456789
}
```

### Response: LinkTelegramResponse

```json
{
  "status": "linked",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "telegram_user_id": 123456789,
  "telegram_username": "@johndev",
  "telegram_first_name": "John"
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-040 | Email must be unique across all users |
| BR-041 | Telegram profile can only be linked to one user |
| BR-042 | User role: "admin" or "member" |
| BR-043 | New users are active by default |

---

## Error Handling

```
[Error: Email already exists]
     │
     │  (409) {error: "User with email john@company.com already exists"}
     │
[Error: Telegram profile not found]
     │
     │  (404) {error: "Telegram user 123456789 not found. User must send at least one message first."}
     │
[Error: Telegram already linked]
     │
     │  (409) {error: "Telegram profile already linked to user 'Jane Doe'"}
     │
[Error: User not found]
     │
     │  (404) {error: "User uuid-x not found"}
```

---

## Future: Email Invitation Flow

```
┌─────────┐       ┌─────────┐       ┌──────────────┐       ┌─────────┐
│ Browser │       │   API   │       │ EmailService │       │ Invitee │
└────┬────┘       └────┬────┘       └──────┬───────┘       └────┬────┘
     │                 │                   │                    │
     │  POST /users/invite                 │                    │
     │  {email, role}  │                   │                    │
     │────────────────►│                   │                    │
     │                 │                   │                    │
     │                 │  Create invite token                   │
     │                 │  INSERT INTO invitations               │
     │                 │                   │                    │
     │                 │  Send email       │                    │
     │                 │──────────────────►│                    │
     │                 │                   │                    │
     │                 │                   │  [Email]           │
     │                 │                   │  "You're invited"  │
     │                 │                   │  [Join Link]       │
     │                 │                   │───────────────────►│
     │                 │                   │                    │
     │◄────────────────│                   │                    │
     │  (202) Invite sent                  │                    │
     │                 │                   │                    │
     ▼                 ▼                   ▼                    ▼

Note: Email invitation is a future feature (v1.2+)
```

---

**Next:** [Telegram Setup Sequence](06-telegram-setup.md)
