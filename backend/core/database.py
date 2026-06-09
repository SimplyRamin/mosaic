# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

import pyodbc
import win32com.client
import pythoncom
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from core.config import settings
from pathlib import Path

QUERIES_DIR = Path(__file__).parent.parent / "queries"


# -------------------------- Analysis Services (DAX) ------------------------- #

def get_as_connection():
    conn = win32com.client.Dispatch("ADODB.Connection")
    conn_str = (
        f"Provider=MSOLAP;"
        f"Data Source={settings.as_server};"
        f"Initial Catalog={settings.as_database};"
        f"Integrated Security=SSPI;"
    )
    conn.Open(conn_str)
    return conn


def run_dax(query: str) -> list[dict]:
    pythoncom.CoInitialize()
    try:
        conn = get_as_connection()
        recordset = win32com.client.Dispatch("ADODB.Recordset")
        recordset.Open(query, conn)

        # Get column names
        columns = []
        for i in range(recordset.Fields.Count):
            # Clean column name - remove "Dim_Employee[" prefix and "]" suffix
            name = recordset.Fields.Item(i).Name
            if '[' in name:
                name = name.split('[')[1].rstrip(']')
            columns.append(name)
        
        # Get rows
        result = []
        while not recordset.EOF:
            row = {}
            for i, col in enumerate(columns):
                row[col] = recordset.Fields.Item(i).Value
            result.append(row)
            recordset.MoveNext()
        
        recordset.Close()
        conn.Close()
        return result
    
    finally:
        pythoncom.CoUninitialize()


def load_query(filename: str, **kwargs) -> str:
    path = QUERIES_DIR / filename
    query = path.read_text(encoding="utf-8")
    # Replace placeholder with actual values
    for key, value in kwargs.items():
        query = query.replace(f"{{{key}}}", str(value))
    return query


# --------------------------- SQL Server (MplusAPP) -------------------------- #

def get_sql_connection():
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={settings.sql_server};"
        f"DATABASE={settings.sql_database};"
        f"UID={settings.sql_username};"
        f"PWD={settings.sql_password};"
    )
    return pyodbc.connect(conn_str)


def run_sql(query: str, params: tuple = ()) -> list[dict]:
    # This function is for SELECT queries
    conn = get_sql_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)

    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]

    result = []
    for row in rows:
        result.append(dict(zip(columns, tuple(row))))

    conn.close()
    return result


def execute_sql(query: str, params: tuple = ()) -> int:
    # This function is for INSERT/UPDATE/DELETE queries
    conn = get_sql_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected


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
