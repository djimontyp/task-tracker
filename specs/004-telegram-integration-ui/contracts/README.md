# API Contracts: Telegram Integration UI

**Feature**: 004-telegram-integration-ui
**Date**: 2025-12-13

## Overview

This feature requires **NO new API endpoints**. All required functionality is available through existing backend APIs.

## Existing Endpoints Used

### Webhook Settings

| Method | Endpoint | Description | Used For |
|--------|----------|-------------|----------|
| GET | `/api/v1/webhook-settings` | Get current config with defaults | Load initial state |
| POST | `/api/v1/webhook-settings` | Save config (without activating) | Save form |
| POST | `/api/v1/webhook-settings/telegram/set` | Activate webhook in Telegram | "Activate" button |
| DELETE | `/api/v1/webhook-settings/telegram` | Deactivate webhook | "Delete Webhook" button |
| GET | `/api/v1/webhook-settings/telegram/info` | Get live webhook info | "Test Connection" |

### Group Management

| Method | Endpoint | Description | Used For |
|--------|----------|-------------|----------|
| POST | `/api/v1/webhook-settings/telegram/groups` | Add group | Add group form |
| DELETE | `/api/v1/webhook-settings/telegram/groups/{id}` | Remove group | Remove button |
| POST | `/api/v1/webhook-settings/telegram/groups/refresh-names` | Refresh names | Refresh button |

## Request/Response Schemas

All schemas are already defined in:
- Backend: `backend/app/schemas/__init__.py`
- Frontend: Generated via orval to `frontend/src/shared/api/model/`

### Key Types

```typescript
// GET /api/v1/webhook-settings
interface WebhookConfigResponse {
  telegram: TelegramWebhookConfig | null
  default_protocol: 'http' | 'https'
  default_host: string
}

// POST /api/v1/webhook-settings/telegram/set
interface SetWebhookRequest {
  protocol: 'http' | 'https'
  host: string
}

interface SetWebhookResponse {
  success: boolean
  webhook_url?: string | null
  message: string
  error?: string | null
}
```

## Frontend API Integration

Existing implementation in `useTelegramSettings.ts`:

```typescript
// Load config
const response = await apiClient.get<WebhookConfigResponseDto>(API_ENDPOINTS.webhookSettings)

// Save and activate
const { data: savedConfig } = await apiClient.post<TelegramWebhookConfigDto>(
  API_ENDPOINTS.webhookSettings,
  { protocol, host }
)
const { data: activateResult } = await apiClient.post<SetWebhookResponseDto>(
  API_ENDPOINTS.telegramWebhook.set,
  { protocol: savedConfig.protocol, host: savedConfig.host }
)
```

## No Changes Required

This feature is frontend-only enhancement:
- ❌ No new endpoints
- ❌ No schema changes
- ❌ No migrations
- ✅ Uses existing contracts
