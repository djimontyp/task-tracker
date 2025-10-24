"""Comprehensive tests for SchemaGenerator service.

Tests cover all field types including:
- Basic JSON types (string, number, integer, boolean, array, object)
- Pydantic extended types (email, url, date)
- Required vs optional fields
- Mixed schemas with multiple types
- Error cases and validation
- Schema validation method
"""

from datetime import date
from uuid import UUID

import pytest
from pydantic import BaseModel, EmailStr, HttpUrl, ValidationError

from app.services.schema_generator import SchemaGenerator


class TestSchemaGeneratorBasicTypes:
    """Test basic JSON Schema type mapping."""

    def test_string_field(self):
        """Test string type mapping."""
        schema = {
            "type": "object",
            "properties": {"name": {"type": "string", "description": "User name"}},
            "required": ["name"],
        }

        Model = SchemaGenerator.generate_response_model(schema, "TestModel")

        assert issubclass(Model, BaseModel)
        assert "name" in Model.model_fields

        instance = Model(name="John Doe")
        assert instance.name == "John Doe"

    def test_string_field_no_description(self):
        """Test string type without description."""
        schema = {
            "type": "object",
            "properties": {"username": {"type": "string"}},
            "required": ["username"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(username="alice")
        assert instance.username == "alice"

    def test_number_field(self):
        """Test number (float) type mapping."""
        schema = {
            "type": "object",
            "properties": {"score": {"type": "number"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(score=95.5)
        assert instance.score == 95.5
        assert isinstance(instance.score, float)

    def test_number_field_integer_input(self):
        """Test number type accepts integer input."""
        schema = {
            "type": "object",
            "properties": {"score": {"type": "number"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(score=95)
        assert float(instance.score) == 95.0

    def test_integer_field(self):
        """Test integer type mapping."""
        schema = {
            "type": "object",
            "properties": {"count": {"type": "integer"}},
            "required": ["count"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(count=42)
        assert instance.count == 42
        assert isinstance(instance.count, int)

    def test_integer_field_rejects_float(self):
        """Test integer type validation rejects float."""
        schema = {
            "type": "object",
            "properties": {"count": {"type": "integer"}},
            "required": ["count"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        with pytest.raises(ValidationError):
            Model(count=42.5)

    def test_boolean_field_true(self):
        """Test boolean type with True value."""
        schema = {
            "type": "object",
            "properties": {"is_active": {"type": "boolean"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(is_active=True)
        assert instance.is_active is True

    def test_boolean_field_false(self):
        """Test boolean type with False value."""
        schema = {
            "type": "object",
            "properties": {"is_active": {"type": "boolean"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(is_active=False)
        assert instance.is_active is False

    def test_array_field(self):
        """Test array (list) type mapping."""
        schema = {
            "type": "object",
            "properties": {"tags": {"type": "array"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(tags=["python", "fastapi"])
        assert instance.tags == ["python", "fastapi"]
        assert isinstance(instance.tags, list)

    def test_array_field_empty(self):
        """Test array type with empty list."""
        schema = {
            "type": "object",
            "properties": {"tags": {"type": "array"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(tags=[])
        assert instance.tags == []

    def test_array_field_mixed_types(self):
        """Test array type with mixed element types."""
        schema = {
            "type": "object",
            "properties": {"items": {"type": "array"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(items=[1, "string", True, {"key": "value"}])
        assert len(instance.items) == 4

    def test_object_field(self):
        """Test object (dict) type mapping."""
        schema = {
            "type": "object",
            "properties": {"metadata": {"type": "object"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(metadata={"key": "value"})
        assert instance.metadata == {"key": "value"}
        assert isinstance(instance.metadata, dict)

    def test_object_field_nested(self):
        """Test object type with nested structure."""
        schema = {
            "type": "object",
            "properties": {"config": {"type": "object"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        nested = {"level1": {"level2": {"level3": "value"}}}
        instance = Model(config=nested)
        assert instance.config == nested

    def test_object_field_empty(self):
        """Test object type with empty dict."""
        schema = {
            "type": "object",
            "properties": {"metadata": {"type": "object"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(metadata={})
        assert instance.metadata == {}


class TestSchemaGeneratorPydanticTypes:
    """Test Pydantic extended type support."""

    def test_email_field_valid(self):
        """Test email type with valid email."""
        schema = {
            "type": "object",
            "properties": {"contact_email": {"type": "email", "description": "Contact email"}},
            "required": ["contact_email"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(contact_email="user@example.com")
        assert str(instance.contact_email) == "user@example.com"

    def test_email_field_invalid(self):
        """Test email type rejects invalid email."""
        schema = {
            "type": "object",
            "properties": {"contact_email": {"type": "email"}},
            "required": ["contact_email"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        with pytest.raises(ValidationError):
            Model(contact_email="invalid-email")

    def test_email_field_with_display_name(self):
        """Test email type with display name format."""
        schema = {
            "type": "object",
            "properties": {"email": {"type": "email"}},
            "required": ["email"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(email="John Doe <john@example.com>")
        assert "john@example.com" in str(instance.email)

    def test_email_field_optional(self):
        """Test optional email field."""
        schema = {
            "type": "object",
            "properties": {"email": {"type": "email"}},
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.email is None

        instance2 = Model(email="test@example.com")
        assert str(instance2.email) == "test@example.com"

    def test_url_field_valid_https(self):
        """Test url type with valid HTTPS URL."""
        schema = {
            "type": "object",
            "properties": {"website": {"type": "url"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(website="https://example.com")
        assert "example.com" in str(instance.website)

    def test_url_field_valid_http(self):
        """Test url type with valid HTTP URL."""
        schema = {
            "type": "object",
            "properties": {"website": {"type": "url"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(website="http://example.com")
        assert "example.com" in str(instance.website)

    def test_url_field_with_path(self):
        """Test url type with path and query parameters."""
        schema = {
            "type": "object",
            "properties": {"api_endpoint": {"type": "url"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(api_endpoint="https://api.example.com/v1/users?limit=10")
        url_str = str(instance.api_endpoint)
        assert "example.com" in url_str

    def test_url_field_invalid(self):
        """Test url type rejects invalid URL."""
        schema = {
            "type": "object",
            "properties": {"website": {"type": "url"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        with pytest.raises(ValidationError):
            Model(website="not-a-url")

    def test_url_field_optional(self):
        """Test optional url field."""
        schema = {
            "type": "object",
            "properties": {"website": {"type": "url"}},
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.website is None

    def test_date_field_iso_format(self):
        """Test date type with ISO format string."""
        schema = {
            "type": "object",
            "properties": {"due_date": {"type": "date", "description": "Deadline"}},
            "required": ["due_date"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(due_date="2025-12-31")
        assert instance.due_date == date(2025, 12, 31)

    def test_date_field_date_object(self):
        """Test date type with date object."""
        schema = {
            "type": "object",
            "properties": {"due_date": {"type": "date"}},
            "required": ["due_date"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        test_date = date(2025, 6, 15)
        instance = Model(due_date=test_date)
        assert instance.due_date == test_date

    def test_date_field_invalid_format(self):
        """Test date type rejects invalid date format."""
        schema = {
            "type": "object",
            "properties": {"due_date": {"type": "date"}},
            "required": ["due_date"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        with pytest.raises(ValidationError):
            Model(due_date="not-a-date")

    def test_date_field_optional(self):
        """Test optional date field."""
        schema = {
            "type": "object",
            "properties": {"start_date": {"type": "date"}},
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.start_date is None

        instance2 = Model(start_date="2025-01-01")
        assert instance2.start_date == date(2025, 1, 1)


class TestSchemaGeneratorOptional:
    """Test required vs optional field handling."""

    def test_required_field_missing_raises_error(self):
        """Test that missing required field raises ValidationError."""
        schema = {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        with pytest.raises(ValidationError):
            Model()

    def test_required_multiple_fields(self):
        """Test multiple required fields."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "email"},
                "age": {"type": "integer"},
            },
            "required": ["name", "email"],
        }

        Model = SchemaGenerator.generate_response_model(schema)

        with pytest.raises(ValidationError):
            Model()

        with pytest.raises(ValidationError):
            Model(name="Alice")

        instance = Model(name="Alice", email="alice@example.com")
        assert instance.name == "Alice"
        assert instance.age is None

    def test_optional_field(self):
        """Test optional fields accept None."""
        schema = {
            "type": "object",
            "properties": {"nickname": {"type": "string"}},
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.nickname is None

    def test_optional_field_with_value(self):
        """Test optional field can have a value."""
        schema = {
            "type": "object",
            "properties": {"nickname": {"type": "string"}},
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(nickname="John")
        assert instance.nickname == "John"

    def test_all_fields_optional(self):
        """Test schema with all optional fields."""
        schema = {
            "type": "object",
            "properties": {
                "field1": {"type": "string"},
                "field2": {"type": "integer"},
                "field3": {"type": "boolean"},
            },
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.field1 is None
        assert instance.field2 is None
        assert instance.field3 is None


class TestSchemaGeneratorMixed:
    """Test complex schemas with multiple types."""

    def test_mixed_basic_types(self):
        """Test schema with all basic types."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "integer"},
                "score": {"type": "number"},
                "is_active": {"type": "boolean"},
                "tags": {"type": "array"},
                "metadata": {"type": "object"},
            },
            "required": ["name"],
        }

        Model = SchemaGenerator.generate_response_model(schema, "MixedModel")
        instance = Model(
            name="Alice",
            age=30,
            score=95.5,
            is_active=True,
            tags=["python", "ai"],
            metadata={"role": "admin"},
        )

        assert instance.name == "Alice"
        assert instance.age == 30
        assert instance.score == 95.5
        assert instance.is_active is True
        assert instance.tags == ["python", "ai"]
        assert instance.metadata == {"role": "admin"}

    def test_mixed_with_pydantic_types(self):
        """Test schema with all supported types including Pydantic types."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "email"},
                "website": {"type": "url"},
                "birthdate": {"type": "date"},
                "score": {"type": "number"},
                "count": {"type": "integer"},
                "is_verified": {"type": "boolean"},
                "interests": {"type": "array"},
                "profile": {"type": "object"},
            },
            "required": ["name", "email"],
        }

        Model = SchemaGenerator.generate_response_model(schema, "UserProfile")

        instance = Model(
            name="Alice Johnson",
            email="alice@example.com",
            website="https://alice.dev",
            birthdate=date(1995, 1, 15),
            score=98.5,
            count=42,
            is_verified=True,
            interests=["python", "ai", "music"],
            profile={"role": "engineer", "department": "AI"},
        )

        assert instance.name == "Alice Johnson"
        assert str(instance.email) == "alice@example.com"
        assert "alice.dev" in str(instance.website)
        assert instance.birthdate == date(1995, 1, 15)
        assert instance.score == 98.5
        assert instance.count == 42
        assert instance.is_verified is True

    def test_partially_filled_optional_fields(self):
        """Test mixed schema with some optional fields provided."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "email"},
                "phone": {"type": "string"},
                "website": {"type": "url"},
            },
            "required": ["name", "email"],
        }

        Model = SchemaGenerator.generate_response_model(schema)

        instance = Model(
            name="Bob",
            email="bob@example.com",
            website="https://bob.com",
        )

        assert instance.name == "Bob"
        assert instance.phone is None
        assert "bob.com" in str(instance.website)


class TestSchemaGeneratorErrors:
    """Test error handling and validation."""

    def test_unsupported_type_error(self):
        """Test ValueError for unsupported JSON type."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "unknown_type"}},
        }

        with pytest.raises(ValueError, match="Unsupported JSON type"):
            SchemaGenerator.generate_response_model(schema)

    def test_empty_schema_error(self):
        """Test ValueError for empty schema."""
        with pytest.raises(ValueError, match="Schema cannot be empty"):
            SchemaGenerator.generate_response_model({})

    def test_none_schema_error(self):
        """Test ValueError for None schema."""
        with pytest.raises(ValueError, match="Schema cannot be empty"):
            SchemaGenerator.generate_response_model(None)

    def test_non_dict_schema_error(self):
        """Test ValueError for non-dict schema."""
        with pytest.raises(ValueError, match="Schema must be a dictionary"):
            SchemaGenerator.generate_response_model("not a dict")

    def test_properties_not_dict_error(self):
        """Test ValueError when properties is not a dict."""
        schema = {
            "type": "object",
            "properties": "not_a_dict",
        }

        with pytest.raises(ValueError, match="'properties' must be a dictionary"):
            SchemaGenerator.generate_response_model(schema)

    def test_required_not_list_error(self):
        """Test ValueError when required is not a list."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
            "required": "not_a_list",
        }

        with pytest.raises(ValueError, match="'required' must be an array"):
            SchemaGenerator.generate_response_model(schema)

    def test_property_schema_not_dict_error(self):
        """Test ValueError when property schema is not a dict."""
        schema = {
            "type": "object",
            "properties": {"field": "not_a_dict"},
        }

        with pytest.raises(ValueError, match="must be a dictionary"):
            SchemaGenerator.generate_response_model(schema)

    def test_property_missing_type_error(self):
        """Test ValueError when property is missing 'type'."""
        schema = {
            "type": "object",
            "properties": {"field": {"description": "No type specified"}},
        }

        with pytest.raises(ValueError, match="missing 'type' specification"):
            SchemaGenerator.generate_response_model(schema)

    def test_top_level_type_not_object_error(self):
        """Test ValueError when top-level type is not 'object'."""
        schema = {
            "type": "string",
            "properties": {"field": {"type": "string"}},
        }

        with pytest.raises(ValueError, match="must be of type 'object'"):
            SchemaGenerator.generate_response_model(schema)

    def test_multiple_unsupported_types(self):
        """Test error on first unsupported type encountered."""
        schema = {
            "type": "object",
            "properties": {
                "field1": {"type": "unknown1"},
                "field2": {"type": "unknown2"},
            },
        }

        with pytest.raises(ValueError, match="Unsupported JSON type"):
            SchemaGenerator.generate_response_model(schema)


class TestSchemaGeneratorLegacyFormat:
    """Test legacy simplified map format for backward compatibility."""

    def test_legacy_format_basic(self):
        """Test legacy format with basic types."""
        schema = {
            "name": {"type": "string", "description": "User name", "required": True},
            "age": {"type": "integer", "required": False},
        }

        Model = SchemaGenerator.generate_response_model(schema)

        with pytest.raises(ValidationError):
            Model()

        instance = Model(name="Alice")
        assert instance.name == "Alice"
        assert instance.age is None

    def test_legacy_format_required_defaults_to_true(self):
        """Test legacy format where required defaults to True."""
        schema = {
            "field": {"type": "string"},  # No required specified
        }

        Model = SchemaGenerator.generate_response_model(schema)

        with pytest.raises(ValidationError):
            Model()

        instance = Model(field="value")
        assert instance.field == "value"

    def test_legacy_format_with_email(self):
        """Test legacy format with Pydantic email type."""
        schema = {
            "email": {"type": "email", "required": True},
            "backup_email": {"type": "email", "required": False},
        }

        Model = SchemaGenerator.generate_response_model(schema)

        with pytest.raises(ValidationError):
            Model()

        instance = Model(email="test@example.com")
        assert str(instance.email) == "test@example.com"
        assert instance.backup_email is None

    def test_legacy_format_field_config_not_dict_error(self):
        """Test legacy format error when field config is not dict."""
        schema = {
            "field": "not_a_dict",
        }

        with pytest.raises(ValueError, match="must be a dictionary"):
            SchemaGenerator.generate_response_model(schema)

    def test_legacy_format_missing_type_error(self):
        """Test legacy format error when field missing type."""
        schema = {
            "field": {"description": "No type", "required": True},
        }

        with pytest.raises(ValueError, match="missing 'type' specification"):
            SchemaGenerator.generate_response_model(schema)


class TestSchemaValidation:
    """Test schema validation method."""

    def test_validate_valid_object_schema(self):
        """Test validate_schema returns True for valid schema."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
        }

        result = SchemaGenerator.validate_schema(schema)
        assert result is True

    def test_validate_valid_schema_with_required(self):
        """Test validate_schema with required fields."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "email"},
                "age": {"type": "integer"},
            },
            "required": ["name", "email"],
        }

        result = SchemaGenerator.validate_schema(schema)
        assert result is True

    def test_validate_valid_legacy_schema(self):
        """Test validate_schema with legacy format."""
        schema = {
            "name": {"type": "string", "required": True},
            "age": {"type": "integer", "required": False},
        }

        result = SchemaGenerator.validate_schema(schema)
        assert result is True

    def test_validate_invalid_schema_unsupported_type(self):
        """Test validate_schema raises for unsupported type."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "invalid"}},
        }

        with pytest.raises(ValueError, match="Unsupported JSON type"):
            SchemaGenerator.validate_schema(schema)

    def test_validate_invalid_schema_empty(self):
        """Test validate_schema raises for empty schema."""
        with pytest.raises(ValueError, match="Schema cannot be empty"):
            SchemaGenerator.validate_schema({})

    def test_validate_invalid_schema_malformed(self):
        """Test validate_schema raises for malformed schema."""
        schema = {
            "type": "object",
            "properties": "not_a_dict",
        }

        with pytest.raises(ValueError):
            SchemaGenerator.validate_schema(schema)


class TestSchemaGeneratorModelNames:
    """Test model name handling and generation."""

    def test_custom_model_name(self):
        """Test custom model name is applied."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
        }

        Model = SchemaGenerator.generate_response_model(schema, "CustomName")
        assert Model.__name__ == "CustomName"

    def test_default_model_name(self):
        """Test default model name is applied."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        assert Model.__name__ == "DynamicResponseModel"

    def test_model_name_with_special_chars_allowed(self):
        """Test model name with numbers and underscores."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
        }

        Model = SchemaGenerator.generate_response_model(schema, "Model_123_Test")
        assert Model.__name__ == "Model_123_Test"


class TestSchemaGeneratorFieldDescriptions:
    """Test field description handling."""

    def test_field_with_description(self):
        """Test field description is preserved."""
        schema = {
            "type": "object",
            "properties": {
                "email": {"type": "email", "description": "User email address"}
            },
        }

        Model = SchemaGenerator.generate_response_model(schema)
        field_info = Model.model_fields["email"]
        assert field_info.description == "User email address"

    def test_field_without_description(self):
        """Test field without description."""
        schema = {
            "type": "object",
            "properties": {"name": {"type": "string"}},
        }

        Model = SchemaGenerator.generate_response_model(schema)
        field_info = Model.model_fields["name"]
        assert field_info.description is None or field_info.description == ""

    def test_multiple_fields_with_descriptions(self):
        """Test multiple fields with different descriptions."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Full name"},
                "email": {"type": "email", "description": "Contact email"},
                "age": {"type": "integer", "description": "Age in years"},
            },
        }

        Model = SchemaGenerator.generate_response_model(schema)
        assert Model.model_fields["name"].description == "Full name"
        assert Model.model_fields["email"].description == "Contact email"
        assert Model.model_fields["age"].description == "Age in years"


class TestSchemaGeneratorEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_single_field_schema(self):
        """Test schema with single field."""
        schema = {
            "type": "object",
            "properties": {"only_field": {"type": "string"}},
            "required": ["only_field"],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(only_field="value")
        assert instance.only_field == "value"

    def test_many_fields_schema(self):
        """Test schema with many fields."""
        properties = {f"field_{i}": {"type": "string"} for i in range(50)}
        schema = {
            "type": "object",
            "properties": properties,
        }

        Model = SchemaGenerator.generate_response_model(schema)
        assert len(Model.model_fields) == 50

    def test_field_names_with_underscores(self):
        """Test field names with underscores."""
        schema = {
            "type": "object",
            "properties": {
                "user_name": {"type": "string"},
                "email_address": {"type": "email"},
                "created_at": {"type": "date"},
            },
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(
            user_name="alice",
            email_address="alice@example.com",
            created_at="2025-01-01",
        )
        assert instance.user_name == "alice"

    def test_field_names_with_numbers(self):
        """Test field names with numbers."""
        schema = {
            "type": "object",
            "properties": {
                "field1": {"type": "string"},
                "field2": {"type": "integer"},
                "field3": {"type": "boolean"},
            },
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model(field1="test", field2=42, field3=True)
        assert instance.field1 == "test"

    def test_empty_required_list(self):
        """Test schema with empty required list."""
        schema = {
            "type": "object",
            "properties": {
                "field1": {"type": "string"},
                "field2": {"type": "integer"},
            },
            "required": [],
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.field1 is None
        assert instance.field2 is None

    def test_none_properties(self):
        """Test schema with None properties."""
        schema = {
            "type": "object",
            "properties": None,
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert len(Model.model_fields) == 0

    def test_none_required_list(self):
        """Test schema with None required list."""
        schema = {
            "type": "object",
            "properties": {"field": {"type": "string"}},
            "required": None,
        }

        Model = SchemaGenerator.generate_response_model(schema)
        instance = Model()
        assert instance.field is None
