# Automation API Reference

**Last Updated:** October 27, 2025
**Status:** Complete API Documentation
**Version:** v1

## Overview

The Automation API provides endpoints for managing scheduling, approval rules, notifications, and statistics.

## Base URL

```
http://localhost/api/v1
```

## Authentication

All endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost/api/v1/automation/stats
```

## Scheduler Endpoints

### GET /scheduler/jobs

List all scheduled jobs.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Daily automation run",
    "cron_expression": "0 9 * * *",
    "next_run_time": "2025-10-27T09:00:00Z",
    "last_run_time": "2025-10-26T09:00:02Z",
    "last_run_duration_ms": 3200,
    "is_active": true,
    "created_at": "2025-10-20T10:30:00Z"
  }
]
```

---

### POST /scheduler/jobs

Create new scheduled job.

**Request:**
```json
{
  "name": "6-hourly automation",
  "cron_expression": "0 */6 * * *",
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "6-hourly automation",
  "cron_expression": "0 */6 * * *",
  "next_run_time": "2025-10-26T12:00:00Z",
  "is_active": true
}
```

---

### PUT /scheduler/jobs/{id}

Update job configuration.

**Request:**
```json
{
  "cron_expression": "0 */4 * * *",
  "is_active": false
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "cron_expression": "0 */4 * * *",
  "is_active": false,
  "next_run_time": "2025-10-27T04:00:00Z"
}
```

---

### POST /scheduler/jobs/{id}/trigger

Manually trigger job immediately.

**Response:** `202 Accepted`
```json
{
  "job_id": 2,
  "status": "queued",
  "message": "Job queued for immediate execution"
}
```

---

### DELETE /scheduler/jobs/{id}

Delete scheduled job.

**Response:** `204 No Content`

---

## Approval Rules Endpoints

### GET /automation/rules

List all approval rules.

**Query Parameters:**
- `active_only` (boolean): Only return active rules (default: false)

**Response:**
```json
[
  {
    "id": 1,
    "name": "High Confidence Auto-Approve",
    "confidence_threshold": 90,
    "similarity_threshold": 85,
    "auto_action": "approve",
    "priority": 1,
    "is_active": true,
    "created_at": "2025-10-20T10:30:00Z",
    "updated_at": "2025-10-26T14:22:00Z"
  },
  {
    "id": 2,
    "name": "Auto-Reject Low Quality",
    "confidence_threshold": 50,
    "similarity_threshold": null,
    "auto_action": "reject",
    "priority": 2,
    "is_active": true,
    "created_at": "2025-10-20T10:35:00Z"
  }
]
```

---

### POST /automation/rules

Create new approval rule.

**Request:**
```json
{
  "name": "Balanced Auto-Approve",
  "confidence_threshold": 80,
  "similarity_threshold": 70,
  "auto_action": "approve",
  "priority": 3,
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "id": 3,
  "name": "Balanced Auto-Approve",
  "confidence_threshold": 80,
  "similarity_threshold": 70,
  "auto_action": "approve",
  "priority": 3,
  "is_active": true,
  "created_at": "2025-10-26T15:45:00Z"
}
```

---

### PUT /automation/rules/{id}

Update approval rule.

**Request:**
```json
{
  "confidence_threshold": 85,
  "similarity_threshold": 75,
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "id": 3,
  "name": "Balanced Auto-Approve",
  "confidence_threshold": 85,
  "similarity_threshold": 75,
  "auto_action": "approve",
  "priority": 3,
  "is_active": true,
  "updated_at": "2025-10-26T16:00:00Z"
}
```

---

### DELETE /automation/rules/{id}

Delete approval rule.

**Response:** `204 No Content`

---

### GET /automation/rules/{id}/preview

Preview how many versions would match rule.

**Query Parameters:**
- `limit` (integer): Max versions to return (default: 100)

**Response:**
```json
{
  "rule_id": 3,
  "matching_versions": 47,
  "preview": [
    {
      "id": 101,
      "version_number": 1,
      "entity_type": "topic",
      "confidence": 87.5,
      "similarity": 78.2,
      "would_approve": true
    },
    {
      "id": 102,
      "version_number": 2,
      "entity_type": "atom",
      "confidence": 92.1,
      "similarity": 85.6,
      "would_approve": true
    }
  ]
}
```

---

### GET /automation/rules/templates

Get pre-built rule templates.

**Response:**
```json
[
  {
    "id": "high-confidence",
    "name": "High Confidence Auto-Approve",
    "description": "Auto-approve versions with 90%+ confidence and 85%+ similarity",
    "template": {
      "confidence_threshold": 90,
      "similarity_threshold": 85,
      "auto_action": "approve"
    }
  },
  {
    "id": "balanced",
    "name": "Balanced Auto-Approve",
    "description": "Standard configuration: 80% confidence, 70% similarity",
    "template": {
      "confidence_threshold": 80,
      "similarity_threshold": 70,
      "auto_action": "approve"
    }
  }
]
```

---

## Notifications Endpoints

### GET /notifications/preferences

Get notification configuration.

**Response:**
```json
{
  "email": {
    "enabled": true,
    "address": "admin@example.com",
    "frequency": "daily",
    "digest_time": "09:00"
  },
  "telegram": {
    "enabled": true,
    "bot_token": "***hidden***",
    "chat_id": "123456789",
    "alert_threshold": 20
  },
  "in_app": {
    "enabled": true,
    "badge_visible": true
  }
}
```

---

### PUT /notifications/preferences

Update notification configuration.

**Request:**
```json
{
  "email": {
    "enabled": true,
    "address": "newemail@example.com",
    "frequency": "weekly"
  },
  "telegram": {
    "enabled": false
  }
}
```

**Response:** `200 OK`

---

### POST /notifications/test-email

Send test email to verify configuration.

**Request:**
```json
{
  "email_address": "test@example.com"
}
```

**Response:** `200 OK`
```json
{
  "status": "sent",
  "message": "Test email sent to test@example.com"
}
```

---

### POST /notifications/test-telegram

Send test Telegram message.

**Response:** `200 OK`
```json
{
  "status": "sent",
  "message": "Test message sent to Telegram chat"
}
```

---

## Statistics Endpoints

### GET /automation/stats

Get automation KPI metrics for dashboard.

**Response:**
```json
{
  "auto_approval_rate": 72.34,
  "pending_versions_count": 8,
  "total_rules_count": 4,
  "active_rules_count": 3
}
```

**Fields:**
- `auto_approval_rate`: Percentage of approved versions (0-100)
- `pending_versions_count`: Count of versions awaiting review
- `total_rules_count`: Total number of automation rules
- `active_rules_count`: Number of enabled rules

---

### GET /automation/trends

Get daily automation trends for dashboard graphs.

**Query Parameters:**
- `period` (string): Time period (7d, 30d, 90d; default: 30d)

**Response:**
```json
{
  "period": "30d",
  "data": [
    {
      "date": "2025-09-27",
      "approved": 12,
      "rejected": 0,
      "manual": 3
    },
    {
      "date": "2025-09-28",
      "approved": 8,
      "rejected": 0,
      "manual": 5
    }
  ]
}
```

**Fields:**
- `period`: Requested time period
- `data`: Array of daily statistics
  - `date`: Date in ISO format (YYYY-MM-DD)
  - `approved`: Versions approved on this date
  - `rejected`: Versions rejected on this date
  - `manual`: Versions pending manual review

---

## Versions Endpoints

### GET /versions/pending-count

Get count of pending versions across all entities.

**Response:**
```json
{
  "count": 15,
  "topics": 8,
  "atoms": 7
}
```

**Fields:**
- `count`: Total pending versions (topics + atoms)
- `topics`: Pending topic versions count
- `atoms`: Pending atom versions count

**Use Case:** Display pending count badge in UI.

---

### POST /versions/bulk-approve

Approve multiple versions in a single operation.

**Request:**
```json
{
  "entity_type": "topic",
  "version_ids": [101, 102, 103]
}
```

**Response:**
```json
{
  "success_count": 2,
  "failed_ids": [103],
  "errors": {
    "103": "Version already approved"
  }
}
```

**Fields:**
- `entity_type`: Entity type ("topic" or "atom")
- `version_ids`: Array of version IDs to approve
- `success_count`: Number of successfully approved versions
- `failed_ids`: Array of IDs that failed
- `errors`: Map of failed ID to error message

---

### POST /versions/bulk-reject

Reject multiple versions in a single operation.

**Request:**
```json
{
  "entity_type": "atom",
  "version_ids": [201, 202]
}
```

**Response:** Same format as bulk-approve.

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "message": "confidence_threshold must be 0-100",
  "details": {
    "field": "confidence_threshold",
    "value": 150
  }
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Rule with ID 99 not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "Database connection failed",
  "request_id": "req-12345"
}
```

---

## Rate Limiting

- **Limit:** 1000 requests per minute per API key
- **Header:** `X-RateLimit-Remaining: 950`
- **Retry after 60 seconds on 429 Too Many Requests**

---

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost/ws?topics=automation');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.event === 'rule_triggered') {
    console.log(`Rule ${data.rule_id} triggered`);
  }

  if (data.event === 'stats_updated') {
    console.log(`Pending: ${data.pending_count}`);
  }
};
```

### Event Types

**rule_triggered:**
```json
{
  "event": "rule_triggered",
  "rule_id": 1,
  "rule_name": "High Confidence Auto-Approve",
  "action": "approve",
  "versions_affected": 12,
  "timestamp": "2025-10-26T09:00:05Z"
}
```

**stats_updated:**
```json
{
  "event": "stats_updated",
  "pending_count": 8,
  "approval_rate": 72.3,
  "false_positive_rate": 2.9,
  "timestamp": "2025-10-26T09:00:10Z"
}
```

---

## Code Examples

### Python (requests)

```python
import requests

BASE_URL = "http://localhost/api/v1"
HEADERS = {"Authorization": f"Bearer YOUR_TOKEN"}

# Get stats
response = requests.get(f"{BASE_URL}/automation/stats", headers=HEADERS)
print(response.json())

# Create rule
rule = {
    "name": "My Custom Rule",
    "confidence_threshold": 85,
    "similarity_threshold": 75,
    "auto_action": "approve"
}
response = requests.post(f"{BASE_URL}/automation/rules", json=rule, headers=HEADERS)
print(response.json())
```

### JavaScript (fetch)

```javascript
const API_URL = 'http://localhost/api/v1';
const token = 'YOUR_TOKEN';

async function getStats() {
  const response = await fetch(`${API_URL}/automation/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function createRule(rule) {
  const response = await fetch(`${API_URL}/automation/rules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rule)
  });
  return response.json();
}
```

### cURL

```bash
# Get stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost/api/v1/automation/stats

# Create rule
curl -X POST http://localhost/api/v1/automation/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Rule",
    "confidence_threshold": 85,
    "similarity_threshold": 75,
    "auto_action": "approve"
  }'
```

---

## See Also

- [Automation Quickstart](../guides/automation-quickstart.md)
- [Configuration Reference](../guides/automation-configuration.md)
- [Job Management](../admin/job-management.md)
