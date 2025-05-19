import re
import json
import requests
from config import db_config
from fastapi import HTTPException

# Replace this with your latest ngrok URL (no trailing slash!)
COLAB_API_URL = "https://dcd0-34-126-126-115.ngrok-free.app"

def extract_sql_codeblock(text: str) -> str:
    """Extract SQL from ```sql ...``` block or return raw."""
    match = re.search(r"```sql\s+(.*?)```", text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text.strip()

def has_balanced_parentheses(text: str) -> bool:
    return text.count("(") == text.count(")")

def ask_for_relevant_tables(prompt: str, table_summary: str) -> list[str]:
    system_message = (
        "You're a helpful assistant that decides which tables are relevant for a given SQL prompt.\n"
        "Only use the table names listed below. Never invent schemas or table names.\n"
        "Always return a JSON list like [\"dbo.TableA\", \"sales.Orders\"]\n\n"
        f"Table Overview:\n{table_summary}"
    )

    try:
        res = requests.post(f"{COLAB_API_URL}/generate", json={
            "prompt": f"{system_message}\n\n{prompt}",
            "max_tokens": 700
        })
        res.raise_for_status()
        raw = res.json()["result"].strip()
        print("🔎 Table extraction response:", raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Table extraction failed: {str(e)}")

    json_match = re.search(r"```json\s*(\[[\s\S]+?\])\s*```", raw, re.IGNORECASE)
    if not json_match:
        json_match = re.search(r"(\[[\s\S]+?\])", raw)

    if not json_match:
        raise ValueError("❌ Could not extract valid JSON list from model response.")

    try:
        return json.loads(json_match.group(1))
    except Exception as e:
        raise ValueError(f"❌ Failed to parse table list: {e}")

def generate_sql(prompt: str, full_schema: str) -> str:
    if db_config["engine"] == "mssql":
        dialect_hint = (
            "Use Microsoft SQL Server (T-SQL) syntax.\n"
            "- Use GETDATE() instead of CURRENT_DATE.\n"
            "- Use full schema-qualified names like dbo.TableName.\n"
            "- Ensure DATEADD, DATEDIFF functions are properly closed."
        )
    elif db_config["engine"] == "mysql":
        dialect_hint = (
            "Use MySQL syntax.\n"
            "- Use CURRENT_DATE and DATABASE()."
        )
    else:
        dialect_hint = "Use standard SQL syntax."

    system_message = (
        f"You are a helpful assistant that writes clean, production-ready SQL queries.\n"
        f"{dialect_hint}\n\n"
        "⚠️ STRICT RULES:\n"
        "- Use ONLY tables and columns listed in the schema.\n"
        "- DO NOT guess names.\n"
        "- DO NOT explain anything.\n"
        "- Always return a SQL query inside a ```sql code block.\n"
        "- Always close parentheses and quote strings correctly.\n"
        "- CTEs (WITH ...) must always end with a SELECT.\n"
        f"Schema:\n{full_schema}"
    )

    try:
        res = requests.post(f"{COLAB_API_URL}/generate", json={
            "prompt": f"{system_message}\n\n{prompt}",
            "max_tokens": 700
        })
        res.raise_for_status()
        raw = res.json()["result"].strip()
        print("🔍 Raw model response:\n", raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")

    sql = extract_sql_codeblock(raw)
    clean_sql = re.sub(r"--.*", "", sql).strip().lower()

    if not clean_sql.startswith(("select", "with")):
        raise ValueError("❌ Model did not return a valid SELECT SQL query.")
    if not has_balanced_parentheses(sql):
        raise ValueError("❌ SQL has unbalanced parentheses.")

    if clean_sql.startswith("with") and "select" not in clean_sql.split(")", 1)[-1]:
        last_cte_match = re.findall(r"with\s+([a-zA-Z_][\w]*)|,\s*([a-zA-Z_][\w]*)", clean_sql, flags=re.IGNORECASE)
        last_cte = None
        for m in last_cte_match:
            last_cte = m[0] or m[1]
        if last_cte:
            print(f"⚠️ Auto-adding missing SELECT from CTE: {last_cte}")
            sql += f"\nSELECT * FROM {last_cte};"

    return sql
