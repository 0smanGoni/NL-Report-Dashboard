import pandas as pd
from sqlalchemy import text
from config import get_session_local, db_config


def get_schema_table_overview():
    """Step 1: Overview of all tables with column names (no types)."""
    session = get_session_local()()
    schema = ""

    try:
        if db_config["engine"] == "mysql":
            tables = session.execute(text("SHOW TABLES")).fetchall()
            for t in tables:
                table_name = t[0]
                cols = session.execute(text(f"SHOW COLUMNS FROM {table_name}")).fetchall()
                col_names = [col[0] for col in cols]
                schema += f"{table_name}: {', '.join(col_names)}\n"

        elif db_config["engine"] == "mssql":
            tables = session.execute(text("""
                SELECT TABLE_SCHEMA, TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
            """)).fetchall()

            for t in tables:
                full_table_name = f"{t[0]}.{t[1]}"  # schema.table
                cols = session.execute(text(f"""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '{t[1]}' AND TABLE_SCHEMA = '{t[0]}'
                """)).fetchall()
                col_names = [col[0] for col in cols]
                schema += f"{full_table_name}: {', '.join(col_names)}\n"

        return schema.strip()

    finally:
        session.close()



def get_full_schema_for_tables(table_names: list[str]):
    """Step 2: Full schema for selected tables (schema + data type)."""
    session = get_session_local()()
    schema = ""

    try:
        for full_table in table_names:
            if "." in full_table:
                schema_name, table_name = full_table.split(".", 1)
            else:
                schema_name, table_name = "dbo", full_table  # fallback default

            schema += f"{schema_name}.{table_name}:\n"

            if db_config["engine"] == "mysql":
                cols = session.execute(text(f"SHOW COLUMNS FROM {table_name}")).fetchall()
                for col in cols:
                    schema += f"  {col[0]} ({col[1]})\n"

            elif db_config["engine"] == "mssql":
                cols = session.execute(text(f"""
                    SELECT COLUMN_NAME, DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '{table_name}' AND TABLE_SCHEMA = '{schema_name}'
                """)).fetchall()
                for col in cols:
                    schema += f"  {col[0]} ({col[1]})\n"

        return schema.strip()

    finally:
        session.close()


def run_sql_query(query: str):
    """Step 3: Execute final SQL and return pandas DataFrame."""
    session = get_session_local()()
    try:
        result = session.execute(text(query))
        rows = result.fetchall()
        columns = result.keys()
        df = pd.DataFrame(rows, columns=columns)
        return df
    finally:
        session.close()
