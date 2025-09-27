# Task Tracker API Documentation

## Overview

The Task Tracker API provides comprehensive endpoints for task management, message processing, and webhook configuration. All endpoints return JSON responses and support both synchronous HTTP requests and real-time WebSocket connections.

**Base URL**: `http://localhost:8000`
**API Prefix**: `/api`
**WebSocket**: `ws://localhost:8000/ws`

---

## Authentication

Currently, the API operates without authentication for development purposes. In production deployments, implement appropriate authentication mechanisms.

---

## Core Endpoints

### API Status & Health

#### `GET /`
**Description**: Get API status and basic information.

**Response**:
```json
{
  "message": "Task Tracker API",
  "status": "running"
}
```

#### `GET /api/health`
**Description**: Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### `GET /api/config`
**Description**: Get client configuration including WebSocket and API URLs.

**Response**:
```json
{
  "websocket_url": "ws://localhost:8000/ws",
  "api_base_url": "http://localhost:8000"
}
```

---

## Task Management

### List Tasks

#### `GET /api/tasks`
**Description**: Retrieve all tasks with pagination support.

**Query Parameters**:
- `limit` (optional): Maximum number of tasks to return (default: 100)
- `offset` (optional): Number of tasks to skip (default: 0)

**Response**:
```json
[
  {
    "id": 1,
    "title": "Fix authentication bug",
    "description": "Users cannot log in with special characters",
    "status": "pending",
    "priority": "high",
    "category": "bug",
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

### Create Task

#### `POST /api/tasks`
**Description**: Create a new task.

**Request Body**:
```json
{
  "title": "Implement dark mode",
  "description": "Add dark theme support to the dashboard",
  "priority": "medium",
  "category": "feature"
}
```

**Response**:
```json
{
  "id": 2,
  "title": "Implement dark mode",
  "description": "Add dark theme support to the dashboard",
  "status": "pending",
  "priority": "medium",
  "category": "feature",
  "created_at": "2025-01-15T10:15:00Z"
}
```

### Get Single Task

#### `GET /api/tasks/{task_id}`
**Description**: Retrieve a specific task by ID.

**Path Parameters**:
- `task_id`: Unique identifier of the task

**Response**:
```json
{
  "id": 1,
  "title": "Fix authentication bug",
  "description": "Users cannot log in with special characters",
  "status": "in_progress",
  "priority": "high",
  "category": "bug",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### Update Task Status

#### `PUT /api/tasks/{task_id}/status`
**Description**: Update the status of a specific task.

**Path Parameters**:
- `task_id`: Unique identifier of the task

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response**:
```json
{
  "message": "Task status updated successfully",
  "task_id": 1,
  "new_status": "completed"
}
```

**Valid Status Values**:
- `pending`
- `in_progress`
- `completed`
- `cancelled`

---

## Message Processing

### Create Message

#### `POST /api/messages`
**Description**: Create a new message for processing and potential task classification.

**Request Body**:
```json
{
  "content": "The login form is broken for users with + symbols in email",
  "source": "telegram",
  "user_id": "user123",
  "channel_id": "support-channel"
}
```

**Response**:
```json
{
  "id": 1,
  "content": "The login form is broken for users with + symbols in email",
  "source": "telegram",
  "user_id": "user123",
  "channel_id": "support-channel",
  "created_at": "2025-01-15T10:20:00Z"
}
```

### List Messages

#### `GET /api/messages`
**Description**: Retrieve all processed messages.

**Query Parameters**:
- `limit` (optional): Maximum number of messages to return (default: 100)
- `offset` (optional): Number of messages to skip (default: 0)
- `source` (optional): Filter by message source (e.g., "telegram", "slack")

**Response**:
```json
[
  {
    "id": 1,
    "content": "The login form is broken for users with + symbols in email",
    "source": "telegram",
    "user_id": "user123",
    "channel_id": "support-channel",
    "created_at": "2025-01-15T10:20:00Z"
  }
]
```

---

## Webhook Management

### Get Webhook Configuration

#### `GET /api/webhook-settings`
**Description**: Retrieve current webhook configuration for all supported platforms.

**Response**:
```json
{
  "telegram": {
    "webhook_url": "https://yourdomain.com/webhook/telegram",
    "is_configured": true,
    "last_updated": "2025-01-15T09:00:00Z"
  },
  "default_protocol": "https",
  "default_host": "yourdomain.com"
}
```

### Save Webhook Settings

#### `POST /api/webhook-settings`
**Description**: Save webhook configuration for a platform.

**Request Body**:
```json
{
  "protocol": "https",
  "host": "yourdomain.com",
  "webhook_path": "/webhook/telegram"
}
```

**Response**:
```json
{
  "webhook_url": "https://yourdomain.com/webhook/telegram",
  "is_configured": true,
  "last_updated": "2025-01-15T10:25:00Z"
}
```

### Set Telegram Webhook

#### `POST /api/webhook-settings/telegram/set`
**Description**: Configure and activate Telegram webhook with the platform.

**Request Body**:
```json
{
  "webhook_url": "https://yourdomain.com/webhook/telegram"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "webhook_url": "https://yourdomain.com/webhook/telegram"
}
```

### Delete Telegram Webhook

#### `DELETE /api/webhook-settings/telegram`
**Description**: Remove Telegram webhook configuration.

**Response**:
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

### Get Telegram Webhook Info

#### `GET /api/webhook-settings/telegram/info`
**Description**: Get current Telegram webhook status from the platform.

**Response**:
```json
{
  "url": "https://yourdomain.com/webhook/telegram",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "last_error_date": null,
  "last_error_message": null,
  "max_connections": 40,
  "allowed_updates": ["message", "callback_query"]
}
```

---

## Webhook Endpoints

### Telegram Webhook Handler

#### `POST /webhook/telegram`
**Description**: Webhook endpoint for receiving Telegram updates. This endpoint is called by Telegram servers.

**Request Body** (Example):
```json
{
  "update_id": 123456,
  "message": {
    "message_id": 789,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "username": "john_doe"
    },
    "chat": {
      "id": -1001234567890,
      "title": "Support Group",
      "type": "supergroup"
    },
    "date": 1642234567,
    "text": "The app crashes when I try to upload large files"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Update processed"
}
```

---

## Statistics & Analytics

### Get Task Statistics

#### `GET /api/stats`
**Description**: Retrieve task statistics and metrics.

**Response**:
```json
{
  "total_tasks": 42,
  "pending_tasks": 15,
  "in_progress_tasks": 8,
  "completed_tasks": 19,
  "by_category": {
    "bug": 18,
    "feature": 12,
    "improvement": 8,
    "question": 4
  },
  "by_priority": {
    "low": 10,
    "medium": 20,
    "high": 8,
    "critical": 4
  }
}
```

---

## Real-Time WebSocket Connection

### WebSocket Endpoint

#### `WS /ws`
**Description**: Establish WebSocket connection for real-time updates.

**Connection Process**:
```javascript
const socket = new WebSocket('ws://localhost:8000/ws');

socket.onopen = function(event) {
    console.log('Connected to WebSocket');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received update:', data);
};
```

**Message Types**:

#### New Task Created
```json
{
  "type": "task_created",
  "data": {
    "id": 3,
    "title": "New task",
    "status": "pending",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

#### Task Status Updated
```json
{
  "type": "task_updated",
  "data": {
    "id": 1,
    "status": "completed",
    "updated_at": "2025-01-15T10:35:00Z"
  }
}
```

#### New Message Received
```json
{
  "type": "message_received",
  "data": {
    "id": 2,
    "content": "Feature request for export functionality",
    "source": "telegram",
    "created_at": "2025-01-15T10:40:00Z"
  }
}
```

---

## Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "detail": "Error description",
  "status_code": 400,
  "timestamp": "2025-01-15T10:45:00Z"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### Validation Errors

Validation errors return detailed field-specific information:

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production deployments, consider implementing rate limiting based on:

- IP address
- API key (when authentication is added)
- User ID
- Endpoint-specific limits

---

## Development & Testing

### Interactive API Documentation

Access the automatic interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Example cURL Commands

#### Create a Task
```bash
curl -X POST "http://localhost:8000/api/tasks" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Fix login issue",
       "description": "Users cannot login with special characters",
       "priority": "high",
       "category": "bug"
     }'
```

#### Get Task Statistics
```bash
curl -X GET "http://localhost:8000/api/stats"
```

#### Update Task Status
```bash
curl -X PUT "http://localhost:8000/api/tasks/1/status" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
```

---

## Integration Examples

### JavaScript/TypeScript Frontend

```typescript
class TaskTrackerAPI {
  private baseURL = 'http://localhost:8000';

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await fetch(`${this.baseURL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/api/tasks`);
    return response.json();
  }
}
```

### Python Client

```python
import httpx
import asyncio

class TaskTrackerClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()

    async def create_task(self, title: str, description: str,
                         priority: str = "medium", category: str = "task"):
        response = await self.client.post(
            f"{self.base_url}/api/tasks",
            json={
                "title": title,
                "description": description,
                "priority": priority,
                "category": category
            }
        )
        response.raise_for_status()
        return response.json()

    async def get_tasks(self):
        response = await self.client.get(f"{self.base_url}/api/tasks")
        response.raise_for_status()
        return response.json()
```

---

## Changelog

### Version 2025.1 (Current)
- ✅ Added comprehensive webhook management endpoints
- ✅ Enhanced task management with priority and category support
- ✅ Real-time WebSocket notifications
- ✅ Improved error handling and validation
- ✅ Added statistics and analytics endpoints

### Planned Features
- 🔄 Authentication and authorization
- 🔄 Advanced filtering and search
- 🔄 Bulk operations
- 🔄 File upload support
- 🔄 Advanced AI classification integration