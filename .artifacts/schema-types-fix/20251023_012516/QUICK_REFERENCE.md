# Schema Generator: Extended Type Support - Quick Reference

## New Types Available

### 1. Email (`email`)
**Type**: `pydantic.EmailStr`
**Validation**: RFC 5322 compliant email addresses

```json
{
  "properties": {
    "email": {
      "type": "email",
      "description": "User email address"
    }
  }
}
```

**Valid Examples**:
- `user@example.com`
- `john.doe+spam@company.co.uk`
- `test123@subdomain.example.com`

**Invalid Examples**:
- `not-an-email` → ValidationError
- `@example.com` → ValidationError
- `user@` → ValidationError

---

### 2. URL (`url`)
**Type**: `pydantic.HttpUrl`
**Validation**: HTTP/HTTPS URLs only

```json
{
  "properties": {
    "website": {
      "type": "url",
      "description": "Project website"
    }
  }
}
```

**Valid Examples**:
- `https://example.com`
- `http://subdomain.example.com/path`
- `https://example.com:8080/api`

**Invalid Examples**:
- `not-a-url` → ValidationError
- `ftp://example.com` → ValidationError (only HTTP/HTTPS)
- `example.com` → ValidationError (missing protocol)

---

### 3. Date (`date`)
**Type**: `datetime.date`
**Validation**: ISO 8601 date format (YYYY-MM-DD)

```json
{
  "properties": {
    "birthdate": {
      "type": "date",
      "description": "Date of birth"
    }
  }
}
```

**Valid Examples**:
- `2024-12-31`
- `1990-01-15`
- `2000-02-29` (leap year)

**Invalid Examples**:
- `not-a-date` → ValidationError
- `31-12-2024` → ValidationError (wrong format)
- `2024-13-01` → ValidationError (invalid month)

---

## Complete Schema Example

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "description": "User ID"
    },
    "name": {
      "type": "string",
      "description": "Full name"
    },
    "email": {
      "type": "email",
      "description": "Contact email"
    },
    "website": {
      "type": "url",
      "description": "Personal website"
    },
    "birthdate": {
      "type": "date",
      "description": "Date of birth"
    },
    "is_active": {
      "type": "boolean",
      "description": "Account status"
    },
    "salary": {
      "type": "number",
      "description": "Annual salary"
    }
  },
  "required": ["id", "name", "email"]
}
```

**Generated Pydantic Model**:
```python
class DynamicResponseModel(BaseModel):
    id: int = Field(description="User ID")
    name: str = Field(description="Full name")
    email: EmailStr = Field(description="Contact email")
    website: HttpUrl | None = Field(default=None, description="Personal website")
    birthdate: date | None = Field(default=None, description="Date of birth")
    is_active: bool | None = Field(default=None, description="Account status")
    salary: float | None = Field(default=None, description="Annual salary")
```

---

## All Supported Types

| JSON Type | Python Type | Validation | Example |
|-----------|-------------|------------|---------|
| `string` | `str` | Any string | `"hello"` |
| `number` | `float` | Decimal numbers | `3.14` |
| `integer` | `int` | Whole numbers | `42` |
| `boolean` | `bool` | True/False | `true` |
| `array` | `list` | Lists | `[1, 2, 3]` |
| `object` | `dict` | Dictionaries | `{"key": "value"}` |
| `email` | `EmailStr` | RFC 5322 email | `"user@example.com"` |
| `url` | `HttpUrl` | HTTP/HTTPS URL | `"https://example.com"` |
| `date` | `date` | ISO 8601 date | `"2024-12-31"` |

---

## Usage in Python

```python
from app.services.schema_generator import SchemaGenerator

schema = {
    "type": "object",
    "properties": {
        "email": {"type": "email"},
        "website": {"type": "url"},
        "birthdate": {"type": "date"}
    },
    "required": ["email"]
}

# Generate model
Model = SchemaGenerator.generate_response_model(schema)

# Create instance
obj = Model(
    email="user@example.com",
    website="https://example.com",
    birthdate="1990-01-15"
)

# Validation happens automatically
print(obj.email)      # "user@example.com" (str)
print(obj.website)    # HttpUrl('https://example.com/')
print(obj.birthdate)  # datetime.date(1990, 1, 15)
```

---

## Error Handling

```python
from pydantic import ValidationError

try:
    obj = Model(email="not-an-email")
except ValidationError as e:
    print(e.errors())
    # [{'type': 'value_error', 'loc': ('email',), 'msg': '...'}]
```

---

## Testing

```python
# Valid data
assert Model(email="test@example.com")

# Invalid email
with pytest.raises(ValidationError):
    Model(email="not-an-email")

# Invalid URL
with pytest.raises(ValidationError):
    Model(email="test@example.com", website="not-a-url")

# Invalid date
with pytest.raises(ValidationError):
    Model(email="test@example.com", birthdate="invalid-date")

# Optional fields default to None
obj = Model(email="test@example.com")
assert obj.website is None
assert obj.birthdate is None
```

---

## Migration Guide

### Before (Not Supported)
```json
{
  "properties": {
    "contact": {"type": "email"}
  }
}
```
❌ Result: `ValueError: Unsupported JSON type: email`

### After (Supported)
```json
{
  "properties": {
    "contact": {"type": "email", "description": "Contact email"}
  },
  "required": ["contact"]
}
```
✅ Result: Valid Pydantic model with email validation

---

## API Integration

When creating TaskConfigs via API:

```bash
curl -X POST http://localhost/api/v1/tasks/configs \
  -H "Content-Type: application/json" \
  -d '{
    "response_schema": {
      "type": "object",
      "properties": {
        "email": {"type": "email", "description": "User email"},
        "website": {"type": "url", "description": "Website"},
        "deadline": {"type": "date", "description": "Deadline"}
      },
      "required": ["email"]
    }
  }'
```

The backend will:
1. Validate the schema structure
2. Generate a Pydantic model with EmailStr, HttpUrl, and date types
3. Use this model for PydanticAI structured outputs
4. Automatically validate agent responses against the schema

---

## Tips

1. **Always specify descriptions**: Makes generated APIs more readable
2. **Use required array**: Clearly mark which fields are mandatory
3. **Test validation**: Write unit tests for expected validation behavior
4. **Handle ValidationError**: Catch and display validation errors to users
5. **ISO 8601 dates**: Always use YYYY-MM-DD format for date fields

---

## Support

For issues or questions:
- File: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/schema_generator.py`
- Tests: `/Users/maks/PycharmProjects/task-tracker/backend/tests/services/test_schema_generator.py`
- Report: `.artifacts/schema-types-fix/20251023_012516/agent-reports/backend-schema-types-report.md`
