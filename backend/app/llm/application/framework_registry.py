"""Framework Registry - Manages available LLM frameworks."""

from typing import ClassVar

from app.llm.domain.exceptions import FrameworkNotSupportedError
from app.llm.domain.ports import LLMFramework


class FrameworkRegistry:
    """Global registry for LLM frameworks.

    Allows runtime framework selection and easy framework switching.

    Usage:
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())

        framework = FrameworkRegistry.get("pydantic_ai")

        framework = FrameworkRegistry.get()
    """

    _frameworks: ClassVar[dict[str, LLMFramework]] = {}
    _default: ClassVar[str | None] = None

    @classmethod
    def register(cls, name: str, framework: LLMFramework) -> None:
        """Register a framework.

        Args:
            name: Framework identifier (e.g., "pydantic_ai", "langchain")
            framework: Framework adapter instance
        """
        cls._frameworks[name] = framework

        if cls._default is None:
            cls._default = name

    @classmethod
    def get(cls, name: str | None = None) -> LLMFramework:
        """Get framework by name.

        Args:
            name: Framework name, or None for default

        Returns:
            LLMFramework adapter

        Raises:
            FrameworkNotSupportedError: If framework not found
        """
        framework_name = name or cls._default

        if framework_name is None:
            raise FrameworkNotSupportedError(
                "No frameworks registered. Register at least one framework."
            )

        if framework_name not in cls._frameworks:
            available = list(cls._frameworks.keys())
            raise FrameworkNotSupportedError(
                f"Framework '{framework_name}' not found. Available: {available}"
            )

        return cls._frameworks[framework_name]

    @classmethod
    def set_default(cls, name: str) -> None:
        """Set default framework.

        Args:
            name: Framework name to use as default

        Raises:
            FrameworkNotSupportedError: If framework not registered
        """
        if name not in cls._frameworks:
            raise FrameworkNotSupportedError(
                f"Cannot set default: framework '{name}' not registered"
            )
        cls._default = name

    @classmethod
    def list_frameworks(cls) -> list[str]:
        """List all registered frameworks."""
        return list(cls._frameworks.keys())
