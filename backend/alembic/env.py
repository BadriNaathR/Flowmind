import sys
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool

# Make sure the backend/ directory is on the path so app.* imports work
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import Base

# Import all models so their metadata is registered on Base
import app.models  # noqa: F401

config = context.config
target_metadata = Base.metadata

# Re-use the same URL parser from database.py so both share the same logic
from app.core.database import _db_url as _DB_URL


def run_migrations_offline() -> None:
    context.configure(
        url=_DB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import event

    connectable = create_engine(_DB_URL, poolclass=pool.NullPool)

    # Port 6543 = Supabase transaction pooler — disable prepared statements
    if _DB_URL.port == 6543:
        @event.listens_for(connectable, "connect")
        def _no_prepared(dbapi_conn, _record):
            dbapi_conn.prepare_threshold = 0

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
