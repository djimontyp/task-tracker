"""Runtime Pydantic model generation from JSON schemas.

Generates Pydantic models dynamically from TaskConfig response_schema JSONB
for use with PydanticAI structured outputs.
"""

from typing import Any

from pydantic import BaseModel, create_model


class SchemaGenerator:
    """Service for generating Pydantic models from JSON schemas.

    Converts TaskConfig response_schema (stored as JSONB) into runtime
    Pydantic models for PydanticAI result_type parameter.
    """

    @staticmethod
    def generate_response_model(
        schema: dict[str, Any],
        model_name: str = "DynamicResponseModel",
    ) -> type[BaseModel]:
        """Generate Pydantic model from JSON schema.

        Supports two input formats:
        1) Full JSON Schema object schema (recommended)
           {
             "type": "object",
             "properties": { "field": {"type": "string", "description": "..."}, ... },
             "required": ["field1", ...]
           }

        2) Legacy simplified map (backward compatibility)
           {
             "field": {"type": "string", "description": "...", "required": true|false}, ...
           }

        Returns a dynamically created Pydantic model class.
        """
        if not schema:
            raise ValueError("Schema cannot be empty")

        if not isinstance(schema, dict):
            raise ValueError("Schema must be a dictionary")

        # Build field definitions for create_model
        field_definitions: dict[str, Any] = {}

        # Full JSON Schema (object) path
        if ("properties" in schema) or (schema.get("type") == "object"):
            if schema.get("type") and schema.get("type") != "object":
                raise ValueError("Top-level schema must be of type 'object'")

            properties = schema.get("properties", {}) or {}
            if not isinstance(properties, dict):
                raise ValueError("'properties' must be a dictionary")

            required_list = schema.get("required", []) or []
            if not isinstance(required_list, list):
                raise ValueError("'required' must be an array of field names")

            from pydantic import Field

            for field_name, field_schema in properties.items():
                if not isinstance(field_schema, dict):
                    raise ValueError(f"Property schema for '{field_name}' must be a dictionary")

                field_type_str = field_schema.get("type")
                if not field_type_str:
                    raise ValueError(f"Property '{field_name}' missing 'type' specification")

                field_type = SchemaGenerator._map_json_type(field_type_str)

                # Optionality driven by top-level 'required' list
                if field_name not in required_list:
                    field_type = field_type | None

                description = field_schema.get("description", "")
                if description:
                    field_definitions[field_name] = (
                        field_type,
                        Field(description=description),
                    )
                else:
                    field_definitions[field_name] = (field_type, ...)

            return create_model(model_name, **field_definitions)

        # Legacy simplified map path
        for field_name, field_config in schema.items():
            if not isinstance(field_config, dict):
                raise ValueError(f"Field config for '{field_name}' must be a dictionary")

            field_type_str = field_config.get("type")
            if not field_type_str:
                raise ValueError(f"Field '{field_name}' missing 'type' specification")

            field_type = SchemaGenerator._map_json_type(field_type_str)

            required = field_config.get("required", True)
            if not required:
                field_type = field_type | None

            description = field_config.get("description", "")

            from pydantic import Field

            if description:
                field_definitions[field_name] = (field_type, Field(description=description))
            else:
                field_definitions[field_name] = (field_type, ...)

        return create_model(model_name, **field_definitions)

    @staticmethod
    def _map_json_type(json_type: str) -> type:
        """Map JSON schema type to Python type.

        Args:
            json_type: JSON schema type string

        Returns:
            Corresponding Python type

        Raises:
            ValueError: If type is not supported
        """
        type_mapping = {
            "string": str,
            "number": float,
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
        }

        if json_type not in type_mapping:
            raise ValueError(f"Unsupported JSON type: {json_type}. Supported types: {', '.join(type_mapping.keys())}")

        return type_mapping[json_type]

    @staticmethod
    def validate_schema(schema: dict[str, Any]) -> bool:
        """Validate JSON schema structure.

        Args:
            schema: JSON schema to validate

        Returns:
            True if schema is valid

        Raises:
            ValueError: If schema is invalid with specific error message

        Example:
            try:
                SchemaGenerator.validate_schema(schema)
                # Schema is valid
            except ValueError as e:
                # Handle invalid schema
                print(f"Invalid schema: {e}")
        """
        try:
            # Try to generate model - will raise ValueError if invalid
            SchemaGenerator.generate_response_model(schema, "ValidationModel")
            return True
        except ValueError:
            raise
