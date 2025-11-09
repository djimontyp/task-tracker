"""Custom JSON encoder for handling non-serializable types.

This module provides a custom JSON encoder that handles common Python types
that are not natively serializable by the standard json library, including:
- UUIDs (converted to strings)
- datetime/date objects (converted to ISO format)
- Decimals (converted to floats)
- Enums (converted to their values)
- Paths (converted to strings)

Usage:
    import json
    from app.core.json_encoder import UUIDJSONEncoder

    data = {"id": uuid.uuid4(), "created_at": datetime.now()}
    json_string = json.dumps(data, cls=UUIDJSONEncoder)
"""

import json
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from pathlib import Path
from typing import Any
from uuid import UUID


class UUIDJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles UUIDs and other non-serializable types.

    Extends json.JSONEncoder to provide automatic conversion of:
    - UUID → string representation
    - datetime/date → ISO 8601 format
    - Decimal → float
    - Enum → enum value
    - Path → string representation
    - Custom objects → dict (via __dict__)

    Example:
        >>> import json
        >>> from uuid import uuid4
        >>> data = {"id": uuid4(), "name": "test"}
        >>> json.dumps(data, cls=UUIDJSONEncoder)
        '{"id": "123e4567-e89b-12d3-a456-426614174000", "name": "test"}'
    """

    def default(self, obj: Any) -> Any:
        """Convert non-serializable objects to JSON-compatible types.

        Args:
            obj: Object to serialize

        Returns:
            JSON-compatible representation of the object

        Raises:
            TypeError: If object type is not handled by this encoder
        """
        if isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, Enum):
            return obj.value
        elif isinstance(obj, Path):
            return str(obj)
        elif hasattr(obj, "__dict__"):
            # Fallback for custom objects - extract public attributes
            return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
        return super().default(obj)
