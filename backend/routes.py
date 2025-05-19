from fastapi import APIRouter, HTTPException
from openai_utils import generate_sql, ask_for_relevant_tables
from report_logic import (
    get_schema_table_overview,
    get_full_schema_for_tables,
    run_sql_query
)
from config import (
    update_db_config,
    get_db_url,
    load_profile_from_db_profiles,
    db_config
)
from sqlalchemy import create_engine, text
import traceback
import datetime
import json
import os

router = APIRouter()
MEMORY_FILE = "saved_reports.json"

if os.path.exists(MEMORY_FILE):
    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        saved_reports_memory = json.load(f)
else:
    saved_reports_memory = []

next_report_id = max([r["id"] for r in saved_reports_memory], default=0) + 1

def save_memory_to_file():
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(saved_reports_memory, f, indent=2, ensure_ascii=False)


@router.post("/analyze")
def analyze(prompt: str):
    print(f"🧠 Received prompt: {prompt}")
    try:
        overview = get_schema_table_overview()
        print("📊 Table overview ready.")

        table_names = ask_for_relevant_tables(prompt, overview)
        if not isinstance(table_names, list) or not table_names:
            raise ValueError("❌ No tables returned from DeepSeek.")

        full_schema = get_full_schema_for_tables(table_names)
        print("📄 Full schema loaded.")

        sql = generate_sql(prompt, full_schema)
        print("✅ SQL generated:\n", sql)

        df = run_sql_query(sql)
        data = df.to_dict(orient="records")

        response = {
            "sql": sql,
            "data": data,
            "columns": df.columns.tolist(),
            "summary": f"{len(df)} rows returned",
            "chart_type": "bar" if len(df.columns) == 2 else "table"
        }
        print("✅ Returning response:", response)
        return response

    except Exception as e:
        print("❌ Error in /analyze route:")
        import traceback
        traceback.print_exc()
        # 👇 Send user-friendly error message to frontend
        raise HTTPException(
            status_code=400,
            detail="Couldn't retrieve data. Please try again or rephrase your request."
        )


# 🔁 Load profile from db_profiles.json by ID
@router.post("/set-profile")
def set_profile(payload: dict):
    profile_id = payload.get("id")
    if not profile_id:
        raise HTTPException(status_code=400, detail="Missing profile ID")

    try:
        load_profile_from_db_profiles(profile_id)
        print("✅ Profile applied successfully")
        return {"status": "loaded", "profile_id": profile_id}
    except Exception as e:
        print("❌ Error in /set-profile:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# 🔄 Set DB config manually (used for raw config payloads)
@router.post("/set-db-config")
def set_db_config(new_config: dict):
    update_db_config(new_config)
    return {"status": "updated"}


# 🔍 Test database connection
@router.get("/test-db-connection")
def test_db_connection():
    try:
        engine = create_engine(get_db_url())
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "success", "message": "Connection successful"}
    except Exception as e:
        return {"status": "failed", "message": str(e)}




# 💾 Save report to memory
@router.post("/save")
def save_report(payload: dict):
    global next_report_id
    report = {
        "id": next_report_id,
        "title": payload.get("title"),
        "original_prompt": payload.get("original_prompt"),
        "sql_query": payload.get("sql_query"),
        "json_result": payload.get("json_result"),
        "summary": payload.get("summary"),
        "chart_type": payload.get("chart_type"),
        "created_at": str(datetime.datetime.now())
    }
    saved_reports_memory.insert(0, report)
    next_report_id += 1
    save_memory_to_file()
    return {"status": "saved"}


# 📋 List saved reports
@router.get("/saved")
def get_saved():
    return saved_reports_memory


# ❌ Delete saved report by ID
@router.delete("/delete/{report_id}")
def delete(report_id: int):
    global saved_reports_memory
    saved_reports_memory = [r for r in saved_reports_memory if r["id"] != report_id]
    save_memory_to_file()
    return {"status": "deleted"}


# 🔧 Debug route to see current active config
@router.get("/config")
def get_config():
    return db_config
