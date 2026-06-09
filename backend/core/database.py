# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from core.config import settings


# --------------------------- Postgres (Portfolio) --------------------------- #

_pg_pool = None

def get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        _pg_pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.database_url
        )
    return _pg_pool


def get_pg_connection():
    return get_pg_pool().getconn()


def release_pg_connection(conn):
    get_pg_pool().putconn(conn)


def run_pg(query: str, params: tuple = ()) -> list[dict]:
    conn = get_pg_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        cursor.close()
        return result
    finally:
        release_pg_connection(conn)


def execute_pg(query: str, params: tuple = ()) -> int:
    conn = get_pg_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected
    finally:
        release_pg_connection(conn)
