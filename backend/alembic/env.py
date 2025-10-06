from logging.config import fileConfig
import asyncio
import sys
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine, async_engine_from_config
from sqlmodel import SQLModel

from alembic import context

# Ensure project root is on sys.path so that `from src...` imports work
THIS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = THIS_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Import all models (new agent management + legacy task tracker)
import backend.app.models  # noqa: F401, E402
from core.config import settings  # type: ignore  # noqa: E402

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target metadata for 'autogenerate'
target_metadata = SQLModel.metadata


def get_url() -> str:
    return settings.migration_database_url


def get_offline_url() -> str:
    """Return a sync-style URL for offline mode if an async driver is used.

    Alembic offline SQL rendering works with either, but normalizing helps
    avoid potential dialect issues for some setups.
    """
    url = get_url()
    # common case: postgresql+asyncpg -> postgresql
    return url.replace("+asyncpg", "")


def process_revision_directives(context, revision, directives):
    """Drop empty autogenerate revisions to avoid noise."""
    cmd_opts = getattr(config, "cmd_opts", None)
    if cmd_opts and getattr(cmd_opts, "autogenerate", False):
        script = directives[0]
        if getattr(script, "upgrade_ops", None) and script.upgrade_ops.is_empty():
            directives[:] = []


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() here emit the given string to the script output.
    """
    url = get_offline_url()
    # also populate the alembic config URL for consistency
    config.set_main_option("sqlalchemy.url", url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using an AsyncEngine."""
    # Support programmatic connection (e.g., tests) via config.attributes
    existing_connection = config.attributes.get("connection")
    if existing_connection is not None:
        await existing_connection.run_sync(do_run_migrations)
        return

    # Set URL onto alembic config and build engine from config to respect
    # any additional options defined in alembic.ini under [alembic]/[sqlalchemy]
    config.set_main_option("sqlalchemy.url", get_url())
    connectable: AsyncEngine = async_engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
