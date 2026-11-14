from sqlalchemy import create_engine, event
from sqlalchemy.engine import URL as _SAURL
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")


def _build_engine():
    if _is_sqlite:
        return create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
        )

    # PostgreSQL — parse the URL manually so special chars in passwords work
    raw = settings.DATABASE_URL
    if "?" in raw:
        raw = raw.split("?")[0]

    scheme, rest = raw.split("://", 1)
    at = rest.rfind("@")                     # last @ = credential/host boundary
    credentials, hostpart = rest[:at], rest[at + 1:]

    colon = credentials.index(":")
    user, password = credentials[:colon], credentials[colon + 1:]

    if "/" in hostpart:
        hostport, dbname = hostpart.split("/", 1)
    else:
        hostport, dbname = hostpart, "postgres"

    host, port = (hostport.split(":") if ":" in hostport else (hostport, "5432"))

    url = _SAURL.create(
        f"{scheme}+psycopg2",
        username=user,
        password=password,
        host=host,
        port=int(port),
        database=dbname,
    )

    eng = create_engine(url, pool_pre_ping=True, pool_size=10, max_overflow=20)

    # Port 6543 = Supabase transaction pooler — prepared statements must be disabled
    if int(port) == 6543:
        @event.listens_for(eng, "connect")
        def _disable_prepared(dbapi_conn, _record):
            dbapi_conn.prepare_threshold = 0

    return eng


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
