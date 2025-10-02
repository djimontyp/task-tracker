# Webhook & Real-Time Messages Implementation Plan

## 1. Objectives
- **Ensure Telegram webhook setup flow works end-to-end** so admins can activate/deactivate it via UI.
- **Synchronize webhook settings between backend DB and frontend** with local fallback when DB entry missing.
- **Provide instant message updates** in the UI using WebSocket stream plus REST hydration.
- **Display sender avatars** consistently using Telegram profile photos (with caching) or fallbacks.

## 2. Scope Breakdown

### 2.1 Backend (FastAPI)
1. **Webhook configuration**
   - Verify existing endpoints in `backend/app/routers.py` (`/api/webhook-settings`, `/api/webhook-settings/telegram/{set,delete}`) and strengthen validation/error handling where needed.
   - Ensure `WebhookSettingsService` persists `protocol`, `host`, `webhook_url`, `is_active`, `last_set_at`.

2. **Telegram webhook activation flow**
   - Confirm `TelegramWebhookService.set_webhook()` uses Bot API correctly and exposes detailed error messages.
   - Update delete flow to mark config inactive and clear timestamps.
   - Add logging metrics for setup/delete outcomes.

3. **Message storage enhancements**
   - Extend `backend/app/models.py` (`Message`) with `sender_avatar_url: str | None` (plus migration) and expose via `MessagePublic`.
   - Add `status` field if needed (`processed` already exists) for UI state.

4. **Avatar fetching & caching**
   - Create helper wrapping Telegram `getUserProfilePhotos` + `getFile`.
   - Cache file IDs/URLs per `user_id` (e.g., Redis or DB JSON).
   - Populate `sender_avatar_url` before persisting messages.

5. **WebSocket broadcasting**
   - Ensure message creation triggers broadcast from `websocket.py`/router with payload including avatar and status.
   - Define consistent event structure: `{"type":"message.new","data":{...}}` and optional `message.updated`.

### 2.2 Frontend (React + Vite)
1. **Webhook settings UI** (`frontend/src/pages/SettingsPage/index.tsx`)
   - Fetch config on mount via new client helper (`apiClient.get('/api/webhook-settings')`).
   - Show editable fields for protocol/host, computed webhook URL, status badge, last set timestamp.
   - Add actions:
     - Save draft → `POST /api/webhook-settings` (updates DB but inactive).
     - Set & Activate → `POST /api/webhook-settings/telegram/set`.
     - Delete → `POST /api/webhook-settings/telegram/delete`.
   - Persist local fallback (`localStorage` keys `WEBHOOK_PROTOCOL`, `WEBHOOK_HOST`) when DB empty.
   - Provide validation + toasts for success/errors.

2. **Messages state management**
   - Create `features/messages/store/messagesStore.ts` (zustand) with methods: `setMessages`, `addOrUpdate`, `markProcessed`.
   - Build `useMessages` hook to hydrate store via REST (`/api/messages`).

3. **WebSocket integration**
   - Extend `useWebSocket` to accept structured events; parse `message.new` → update store instantly.
   - Handle reconnection gracefully (already partially implemented).

4. **UI components**
   - Create `shared/components/MessageFeed.tsx` and `MessageItem.tsx` for reusable rendering (avatars, status badge, hover effects).
   - Replace direct mapping in `DashboardPage` with new components and hooks.
   - Provide fallback icons (`shared/lib/avatar.ts`) based on message source if avatar URL missing.

### 2.3 Testing & Verification
- **Backend**: unit/integration tests for webhook endpoints and avatar helper; manual Telegram flow via ngrok.
- **Frontend**: component tests for MessageFeed (optional), Cypress/Playwright scenario for webhook settings form.
- **End-to-end**: trigger Telegram message → confirm WebSocket broadcast updates dashboard immediately with avatar/status.

## 3. Execution Sequence
1. Backend: migrations + webhook service validation tweaks.
2. Backend: avatar fetch/cache integration and WebSocket payload updates.
3. Frontend: webhook settings form (REST integration, local fallback, UX polish).
4. Frontend: messages store + WebSocket hook updates + new components.
5. QA: manual plus automated tests, finalize documentation.

## 4. Risks & Mitigations
- **Telegram API limits**: cache avatars to avoid repeated `getUserProfilePhotos` calls.
- **Local vs DB state drift**: on successful `Save`/`Set`, overwrite local fallback with server data.
- **WebSocket disconnects**: rely on existing reconnect logic; optionally display toast when offline.
- **Backward compatibility**: guard UI rendering when new fields absent (fallback to defaults).

## 5. Deliverables
- Updated backend models/services/schema + migration scripts.
- New webhook settings UI with working flows.
- Real-time message feed with avatars.
- Tests (unit/integration) and manual validation notes.
- Documentation snippets (README/PROGRESS update if needed).
