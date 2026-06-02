# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

import win32com.client
import pythoncom
from core.config import settings
from pathlib import Path

QUERIES_DIR = Path(__file__).parent.parent / "queries"


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


def load_query(filename: str, **kwargs) -> str:
    path = QUERIES_DIR / filename
    query = path.read_text(encoding="utf-8")
    # Replace placeholder with actual values
    for key, value in kwargs.items():
        query = query.replace(f"{{{key}}}", str(value))
    return query


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