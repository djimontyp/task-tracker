# Security Requirements

**Продукт:** Pulse Radar
**Статус:** Draft
**Дата:** 2025-12-11

---

## Overview

Вимоги безпеки для Pulse Radar MVP та roadmap для production-ready системи.

| Category | Current Status | MVP Target |
|----------|----------------|------------|
| Authentication | Not implemented | Required |
| Data Encryption | Partial | Sufficient |
| Input Validation | Good | Sufficient |
| API Security | Basic | Needs work |
| Infrastructure | Good | Sufficient |

---

## 1. Authentication & Authorization

### Current State: Not Implemented

Система **не має механізму аутентифікації**:
- Всі API endpoints доступні без авторизації
- WebSocket дозволяє підключення без перевірки ідентичності
- User model існує, але не використовується для access control

### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-AUTH-001 | Implement session-based or JWT authentication | Critical | Not started |
| SEC-AUTH-002 | Role-based access control (admin/member) | High | Not started |
| SEC-AUTH-003 | Secure password hashing (bcrypt/argon2) | Critical | Not started |
| SEC-AUTH-004 | Session timeout (configurable, default 24h) | Medium | Not started |
| SEC-AUTH-005 | WebSocket authentication via token | High | Not started |

### Recommended Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTH FLOW (Recommended)                    │
└─────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Browser │     │   API   │     │   DB    │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         │  POST /auth/login             │
         │  {email, password}            │
         │──────────────►│               │
         │               │               │
         │               │  Verify credentials
         │               │──────────────►│
         │               │◄──────────────│
         │               │               │
         │               │  Generate JWT │
         │               │  (access + refresh)
         │               │               │
         │◄──────────────│               │
         │  {access_token, refresh_token}│
         │               │               │
         │  GET /api/v1/resource         │
         │  Authorization: Bearer {token}│
         │──────────────►│               │
         │               │               │
         │               │  Validate JWT │
         │               │  Check permissions
         │               │               │
         │◄──────────────│               │
         │  (200) Resource data          │
         │               │               │
```

### Files to Create

```python
# backend/app/core/security.py
from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool: ...
def get_password_hash(password: str) -> str: ...
def create_access_token(data: dict) -> str: ...
def verify_token(token: str) -> dict | None: ...
```

---

## 2. Data Protection

### Current State: Partially Implemented

**Implemented:**
- API key encryption (Fernet) for LLM providers
- Settings encryption (AES-256-GCM)

**Not Implemented:**
- User password hashing
- Audit logging
- Secret rotation

### Credential Encryption

**File:** `backend/app/services/credential_encryption.py`

```python
class CredentialEncryption:
    """Fernet-based encryption for API credentials."""

    def __init__(self) -> None:
        key = settings.app.encryption_key
        self._fernet = Fernet(key.encode())

    def encrypt(self, plaintext: str) -> bytes: ...
    def decrypt(self, ciphertext: bytes) -> str: ...
```

**Security Properties:**
- Algorithm: Fernet (AES-128-CBC + HMAC-SHA256)
- Key source: `ENCRYPTION_KEY` environment variable
- Usage: LLM provider API keys before DB storage

### Settings Encryption

**File:** `backend/core/crypto.py`

```python
class SettingsCrypto:
    """AES-256-GCM encryption for configuration data."""

    def _derive_key(self) -> bytes:
        # PBKDF2-HMAC-SHA256, 100,000 iterations
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=b"task-tracker-settings-salt-v1",
            iterations=100000,
        )
        return kdf.derive(password)
```

**Security Properties:**
- Algorithm: AES-256-GCM (authenticated encryption)
- Key derivation: PBKDF2 with 100K iterations
- Key source: `SETTINGS_ENCRYPTION_KEY` environment variable

### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-DATA-001 | Encrypt API keys before DB storage | Critical | Done |
| SEC-DATA-002 | Never log sensitive data (keys, tokens) | Critical | Partial |
| SEC-DATA-003 | Secure key derivation (PBKDF2/Argon2) | High | Done |
| SEC-DATA-004 | Implement secret rotation policy | Medium | Not started |
| SEC-DATA-005 | Audit log for sensitive operations | Medium | Not started |

### Environment Variables (Secrets)

| Variable | Description | Required |
|----------|-------------|----------|
| `ENCRYPTION_KEY` | Fernet key for credentials | Yes |
| `SETTINGS_ENCRYPTION_KEY` | AES key for settings | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | Yes |
| `TELEGRAM_API_ID` | Telegram client API ID | Optional |
| `TELEGRAM_API_HASH` | Telegram client API hash | Optional |

**Warning:** Default values exist for development. Production MUST override all secrets.

---

## 3. Input Validation

### Current State: Good (Pydantic + FastAPI)

**Implemented:**
- Pydantic validators for all request/response models
- SQLModel parameterized queries (SQL injection prevention)
- React JSX escaping (basic XSS prevention)
- Centralized error handling middleware

### Validation Examples

**Phone Number Validation:**
```python
# backend/app/models/user.py
@field_validator("phone")
@classmethod
def validate_phone(cls, v: str | None) -> str | None:
    if v and not re.match(r"^\+?[1-9]\d{1,14}$", v):
        raise ValueError("Invalid phone number format")
    return v
```

**Color Validation:**
```python
# backend/app/models/topic.py
@field_validator("color", mode="before")
@classmethod
def validate_and_convert_color(cls, v: str | None) -> str | None:
    return convert_to_hex_if_needed(str(v)) if v else None
```

**Range Validation:**
```python
# backend/app/models/llm_provider.py
confidence: float | None = Field(
    default=None,
    ge=0.0,  # >= 0
    le=1.0,  # <= 1
)
```

### Error Handling Middleware

**File:** `backend/app/middleware/error_handler.py`

```python
class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except RequestValidationError as exc:
            logger.warning(f"Validation error: {exc.errors()}")
            return JSONResponse(
                status_code=422,
                content={"detail": exc.errors()},
            )
```

### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-INPUT-001 | Validate all user input (Pydantic) | Critical | Done |
| SEC-INPUT-002 | Parameterized SQL queries (SQLModel) | Critical | Done |
| SEC-INPUT-003 | HTML sanitization for user content | High | Not started |
| SEC-INPUT-004 | File upload validation (size, type) | Medium | N/A |
| SEC-INPUT-005 | JSON schema validation for webhooks | Medium | Partial |

---

## 4. API Security

### CORS Configuration

**File:** `backend/app/main.py`

```python
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)
```

**Current:** Allows localhost by default, wildcard (`*`) possible.
**Recommendation:** Explicit origins list for production.

### Webhook Security

**Current State:** NOT VERIFIED

**File:** `backend/app/webhooks/telegram.py`

```python
@router.post("/telegram")
async def telegram_webhook(request: Request):
    update_data = await request.json()
    # ❌ No signature verification!
```

**Required Fix:**
```python
@router.post("/telegram")
async def telegram_webhook(request: Request):
    # Verify Telegram signature
    secret_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if secret_token != settings.telegram.webhook_secret:
        raise HTTPException(status_code=403, detail="Invalid signature")

    update_data = await request.json()
    # Process...
```

### Rate Limiting

**Current State:** NOT IMPLEMENTED

**Recommended Implementation:**
```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/search")
@limiter.limit("10/minute")
async def search(request: Request):
    ...
```

### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-API-001 | Explicit CORS origins (no wildcard) | High | Partial |
| SEC-API-002 | Telegram webhook signature verification | Critical | Not started |
| SEC-API-003 | Rate limiting (10-100 req/min) | High | Not started |
| SEC-API-004 | Request ID for tracing | Medium | Done |
| SEC-API-005 | API versioning (/api/v1/) | Low | Done |

---

## 5. Infrastructure Security

### Docker Security

**File:** `backend/Dockerfile`

```dockerfile
# Multi-stage build (smaller image, fewer vulnerabilities)
FROM python:3.12-slim AS dependencies
FROM python:3.12-slim AS application

# Non-root user
RUN groupadd --gid 1001 --system appgroup && \
    useradd --uid 1001 --system --gid appgroup appuser
USER appuser

# Minimal dependencies
RUN apt-get install -y curl procps && rm -rf /var/lib/apt/lists/*
```

**Status:** Well configured

### Database Security

**Default credentials (development only):**
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker
```

**Production:** MUST override via environment variable with secure credentials.

### Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK TOPOLOGY                          │
└─────────────────────────────────────────────────────────────┘

    Internet
        │
        ▼
   ┌─────────┐
   │  Nginx  │ ◄── HTTPS termination, reverse proxy
   └────┬────┘
        │
   Docker Network (internal)
        │
   ┌────┴────┬─────────┬─────────┐
   │         │         │         │
   ▼         ▼         ▼         ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌─────────┐
│ API │  │ WS  │  │Worker│  │PostgreSQL│
└─────┘  └─────┘  └─────┘  └─────────┘
   │                           │
   └───────────────────────────┘
           Internal only
```

### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-INFRA-001 | Non-root Docker containers | Critical | Done |
| SEC-INFRA-002 | HTTPS enforcement (production) | Critical | Partial |
| SEC-INFRA-003 | Docker network isolation | High | Done |
| SEC-INFRA-004 | No default credentials in production | Critical | Warning |
| SEC-INFRA-005 | Security headers (X-Frame-Options, etc.) | Medium | Not started |

---

## 6. OWASP Top 10 Compliance

| # | Vulnerability | Status | Notes |
|---|---------------|--------|-------|
| A01 | Broken Access Control | Not addressed | No auth implemented |
| A02 | Cryptographic Failures | Partial | Encryption OK, but no auth |
| A03 | Injection | Good | SQLModel parameterized queries |
| A04 | Insecure Design | Partial | Need threat modeling |
| A05 | Security Misconfiguration | Partial | Default creds, CORS |
| A06 | Vulnerable Components | Unknown | Need dependency audit |
| A07 | Auth Failures | Not addressed | No auth |
| A08 | Data Integrity Failures | Partial | No webhook verification |
| A09 | Logging Failures | Partial | Basic logging, no audit |
| A10 | SSRF | Low risk | Limited external calls |

---

## Security Roadmap

### MVP (Current Sprint)

1. Telegram webhook signature verification
2. Explicit CORS configuration
3. Remove default credentials warning

### v1.1 (Next Sprint)

1. JWT authentication
2. Role-based access control
3. Rate limiting middleware
4. Security headers

### v1.2 (Future)

1. OAuth integration (Google, GitHub)
2. Audit logging
3. Secret rotation
4. Penetration testing

---

## Security Checklist (Pre-Production)

```
□ All secrets in environment variables (not in code)
□ No default credentials
□ HTTPS enforced
□ CORS explicitly configured
□ Webhook signatures verified
□ Rate limiting enabled
□ Authentication implemented
□ Authorization (RBAC) implemented
□ Security headers configured
□ Dependency audit completed
□ Error messages don't leak internal details
□ Logging doesn't include sensitive data
```

---

**Related Documents:**
- [Business Rules](./business-rules.md) — BR-040 to BR-054 (security-related)
- [Data Dictionary](../02-data-dictionary.md) — Encrypted fields
- [Infrastructure](../../architecture/OVERVIEW.md) — Deployment architecture
