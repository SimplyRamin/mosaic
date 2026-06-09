# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

import psycopg2
from psycopg2.extras import RealDictCursor
from core.config import settings


# --------------------------- Postgres (Portfolio) -------------------------- #

def get_pg_connection():
    return psycopg2.connect(settings.database_url)


def run_pg(query: str, params: tuple = ()) -> list[dict]:
    conn = get_pg_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def execute_pg(query: str, params: tuple = ()) -> int:
    conn = get_pg_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()