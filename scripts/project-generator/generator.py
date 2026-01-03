#!/usr/bin/env python3
"""
Project Generator from YAML Fixtures

Generates complete project structure from YAML fixture definition.
Supports FastAPI + React projects with models, endpoints, components.
"""

import yaml
from pathlib import Path
from typing import Any, Dict, List
from jinja2 import Environment, FileSystemLoader, Template
import shutil
from pydantic import BaseModel, Field


# ============================================================================
# Pydantic Models for Validation
# ============================================================================

class TechStackBackend(BaseModel):
    language: str
    framework: str
    orm: str
    database: str


class TechStackFrontend(BaseModel):
    framework: str
    language: str
    build_tool: str
    ui_library: str


class TechStack(BaseModel):
    backend: TechStackBackend
    frontend: TechStackFrontend


class Directory(BaseModel):
    path: str
    description: str = ""
    create_init: bool = False


class File(BaseModel):
    path: str
    type: str  # template | static | generated
    template: str | None = None
    content: str | None = None
    generator: str | None = None
    variables: Dict[str, Any] = Field(default_factory=dict)


class ModelField(BaseModel):
    name: str
    type: str
    nullable: bool = False
    default: Any = None
    description: str = ""


class ModelRelationship(BaseModel):
    name: str
    model: str
    type: str  # one_to_many | many_to_one | many_to_many
    back_populates: str


class Model(BaseModel):
    name: str
    table_name: str
    description: str = ""
    fields: List[ModelField]
    relationships: List[ModelRelationship] = Field(default_factory=list)


class EndpointMethod(BaseModel):
    method: str  # GET | POST | PUT | PATCH | DELETE
    summary: str
    response_model: str | None = None
    request_model: str | None = None
    auth_required: bool = False


class Endpoint(BaseModel):
    path: str
    tag: str
    methods: List[EndpointMethod]


class ComponentProp(BaseModel):
    name: str
    type: str
    required: bool = True
    description: str = ""


class ComponentImport(BaseModel):
    from_: str = Field(alias="from")
    items: List[str]


class Component(BaseModel):
    name: str
    path: str
    type: str = "functional"
    props: List[ComponentProp] = Field(default_factory=list)
    hooks: List[str] = Field(default_factory=list)
    imports: List[ComponentImport] = Field(default_factory=list)


class Page(BaseModel):
    name: str
    route: str
    layout: str
    components: List[str] = Field(default_factory=list)


class ProjectFixture(BaseModel):
    name: str
    display_name: str
    description: str
    version: str = "0.1.0"
    tech_stack: TechStack
    directories: List[Directory] = Field(default_factory=list)
    files: List[File] = Field(default_factory=list)
    models: List[Model] = Field(default_factory=list)
    endpoints: List[Endpoint] = Field(default_factory=list)
    components: List[Component] = Field(default_factory=list)
    pages: List[Page] = Field(default_factory=list)


# ============================================================================
# Code Generators
# ============================================================================

class ModelGenerator:
    """Generates SQLModel model classes from fixture definition"""

    @staticmethod
    def generate(model: Model) -> str:
        lines = [
            f'"""',
            f'{model.description or model.name} model',
            f'"""',
            f'from sqlmodel import Field, SQLModel, Relationship',
            f'from datetime import datetime',
            f'from typing import Optional, List',
            f'',
            f'',
            f'class {model.name}(SQLModel, table=True):',
            f'    __tablename__ = "{model.table_name}"',
            f'',
        ]

        # Fields
        for field in model.fields:
            field_type = field.type
            if field.nullable:
                field_type = f"Optional[{field_type}]"

            field_def = f"    {field.name}: {field_type}"

            # Field configuration
            field_args = []
            if field.default is not None:
                field_args.append(f"default={repr(field.default)}")
            if field.nullable:
                field_args.append("nullable=True")
            if field.description:
                field_args.append(f'description="{field.description}"')

            if field.name == "id":
                field_args.append("primary_key=True")

            if field_args:
                field_def += f" = Field({', '.join(field_args)})"

            lines.append(field_def)

        # Relationships
        if model.relationships:
            lines.append("")
            lines.append("    # Relationships")
            for rel in model.relationships:
                rel_type = f'List["{rel.model}"]' if "many" in rel.type else f'Optional["{rel.model}"]'
                lines.append(
                    f'    {rel.name}: {rel_type} = Relationship(back_populates="{rel.back_populates}")'
                )

        return "\n".join(lines)


class EndpointGenerator:
    """Generates FastAPI endpoint routers from fixture definition"""

    @staticmethod
    def generate(endpoint: Endpoint) -> str:
        lines = [
            f'"""',
            f'{endpoint.tag} API endpoints',
            f'"""',
            f'from fastapi import APIRouter, Depends, HTTPException, status',
            f'from typing import List',
            f'',
            f'router = APIRouter(prefix="{endpoint.path}", tags=["{endpoint.tag}"])',
            f'',
        ]

        for method_def in endpoint.methods:
            method = method_def.method.lower()
            func_name = f"{method}_{endpoint.tag.lower().replace(' ', '_')}"

            # Decorator
            decorator_args = [f'summary="{method_def.summary}"']
            if method_def.response_model:
                decorator_args.append(f"response_model={method_def.response_model}")

            lines.append(f'@router.{method}("/", {", ".join(decorator_args)})')

            # Function signature
            params = []
            if method_def.request_model:
                params.append(f"data: {method_def.request_model}")
            if method_def.auth_required:
                params.append("current_user = Depends(get_current_user)")

            params_str = ", ".join(params) if params else ""
            lines.append(f"async def {func_name}({params_str}):")
            lines.append(f'    """')
            lines.append(f'    {method_def.summary}')
            lines.append(f'    """')
            lines.append(f'    # TODO: Implement')
            lines.append(f'    raise HTTPException(status_code=501, detail="Not implemented")')
            lines.append("")

        return "\n".join(lines)


class ComponentGenerator:
    """Generates React component from fixture definition"""

    @staticmethod
    def generate(component: Component) -> str:
        lines = []

        # Imports
        for imp in component.imports:
            items = ", ".join(imp.items)
            lines.append(f"import {{ {items} }} from '{imp.from_}'")

        if component.hooks:
            hooks = ", ".join(component.hooks)
            lines.append(f"import {{ {hooks} }} from 'react'")

        lines.append("")

        # Props interface
        if component.props:
            lines.append(f"interface {component.name}Props {{")
            for prop in component.props:
                optional = "?" if not prop.required else ""
                lines.append(f"  {prop.name}{optional}: {prop.type}")
            lines.append("}")
            lines.append("")

        # Component
        props_param = f"{{ {', '.join(p.name for p in component.props)} }}: {component.name}Props" if component.props else ""
        lines.append(f"export function {component.name}({props_param}) {{")
        lines.append(f"  // TODO: Implement")
        lines.append(f"  return (")
        lines.append(f"    <div>")
        lines.append(f"      <h2>{component.name}</h2>")
        lines.append(f"    </div>")
        lines.append(f"  )")
        lines.append(f"}}")

        return "\n".join(lines)


# ============================================================================
# Main Generator
# ============================================================================

class ProjectGenerator:
    """Main project generator from YAML fixture"""

    def __init__(self, fixture_path: Path, output_dir: Path):
        self.fixture_path = fixture_path
        self.output_dir = output_dir
        self.fixture: ProjectFixture | None = None

        # Setup Jinja2 for templates
        templates_dir = fixture_path.parent / "templates"
        templates_dir.mkdir(exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(str(templates_dir)))

    def load_fixture(self) -> ProjectFixture:
        """Load and validate YAML fixture"""
        print(f"📖 Loading fixture: {self.fixture_path}")

        with open(self.fixture_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        # Extract project section
        project_data = data.get("project", {})

        # Validate with Pydantic
        self.fixture = ProjectFixture(**project_data)
        print(f"✅ Fixture validated: {self.fixture.display_name}")
        return self.fixture

    def generate(self):
        """Generate complete project structure"""
        if not self.fixture:
            self.load_fixture()

        print(f"\n🚀 Generating project: {self.fixture.display_name}")
        print(f"📁 Output directory: {self.output_dir}\n")

        # Create project root
        project_root = self.output_dir / self.fixture.name
        project_root.mkdir(parents=True, exist_ok=True)

        # 1. Create directories
        self._create_directories(project_root)

        # 2. Generate models
        self._generate_models(project_root)

        # 3. Generate endpoints
        self._generate_endpoints(project_root)

        # 4. Generate components
        self._generate_components(project_root)

        # 5. Generate static files
        self._generate_files(project_root)

        print(f"\n✅ Project generated successfully!")
        print(f"📂 Location: {project_root}")

    def _create_directories(self, root: Path):
        """Create directory structure"""
        print("📁 Creating directories...")
        for directory in self.fixture.directories:
            dir_path = root / directory.path
            dir_path.mkdir(parents=True, exist_ok=True)

            if directory.create_init:
                (dir_path / "__init__.py").touch()

            print(f"  ✓ {directory.path}")

    def _generate_models(self, root: Path):
        """Generate SQLModel model classes"""
        if not self.fixture.models:
            return

        print("\n🗄️  Generating models...")
        models_dir = root / "backend" / "app" / "models"
        models_dir.mkdir(parents=True, exist_ok=True)

        for model in self.fixture.models:
            code = ModelGenerator.generate(model)
            file_path = models_dir / f"{model.name.lower()}.py"
            file_path.write_text(code, encoding="utf-8")
            print(f"  ✓ {model.name} → {file_path.relative_to(root)}")

    def _generate_endpoints(self, root: Path):
        """Generate FastAPI endpoint routers"""
        if not self.fixture.endpoints:
            return

        print("\n🔌 Generating endpoints...")
        api_dir = root / "backend" / "app" / "api"
        api_dir.mkdir(parents=True, exist_ok=True)

        for endpoint in self.fixture.endpoints:
            code = EndpointGenerator.generate(endpoint)
            filename = endpoint.tag.lower().replace(" ", "_") + ".py"
            file_path = api_dir / filename
            file_path.write_text(code, encoding="utf-8")
            print(f"  ✓ {endpoint.tag} → {file_path.relative_to(root)}")

    def _generate_components(self, root: Path):
        """Generate React components"""
        if not self.fixture.components:
            return

        print("\n⚛️  Generating components...")
        frontend_dir = root / "frontend" / "src"
        frontend_dir.mkdir(parents=True, exist_ok=True)

        for component in self.fixture.components:
            code = ComponentGenerator.generate(component)
            comp_dir = frontend_dir / component.path
            comp_dir.mkdir(parents=True, exist_ok=True)

            file_path = comp_dir / f"{component.name}.tsx"
            file_path.write_text(code, encoding="utf-8")
            print(f"  ✓ {component.name} → {file_path.relative_to(root)}")

    def _generate_files(self, root: Path):
        """Generate static and template files"""
        if not self.fixture.files:
            return

        print("\n📄 Generating files...")
        for file_def in self.fixture.files:
            file_path = root / file_def.path

            if file_def.type == "static":
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file_def.content or "", encoding="utf-8")

            elif file_def.type == "template":
                template = self.jinja_env.get_template(file_def.template)
                content = template.render(
                    project=self.fixture,
                    **file_def.variables
                )
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(content, encoding="utf-8")

            print(f"  ✓ {file_def.path}")


# ============================================================================
# CLI
# ============================================================================

def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python generator.py <fixture.yaml> [output_dir]")
        sys.exit(1)

    fixture_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path.cwd()

    if not fixture_path.exists():
        print(f"❌ Fixture not found: {fixture_path}")
        sys.exit(1)

    generator = ProjectGenerator(fixture_path, output_dir)
    generator.generate()


if __name__ == "__main__":
    main()
