import json
import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db import set_engine  # Ensure this is safe and cyclic-import free

# Global session handle
SessionLocal = None

# Global DB config memory
db_config = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "foodbee",
    "deepseek_api_key": "",
    "engine": "mysql"  # or "mssql"
}

# Updates db_config safely with aliases
def update_db_config(new_config):
    mapping = {
        "DB_HOST": "host",
        "DB_PORT": "port",
        "DB_USER": "user",
        "DB_PASSWORD": "password",
        "DB_NAME": "database",
        "ENGINE": "engine",
        "DEEPSEEK_API_KEY": "deepseek_api_key",
        "host": "host",
        "port": "port",
        "user": "user",
        "password": "password",
        "database": "database",
        "engine": "engine",
        "deepseek_api_key": "deepseek_api_key"
    }
    for k, v in new_config.items():
        mapped_key = mapping.get(k)
        if mapped_key:
            db_config[mapped_key] = v

# Returns the currently active SQLAlchemy SessionLocal
def get_session_local():
    if SessionLocal is None:
        raise RuntimeError("❌ SessionLocal not initialized. Please apply a DB profile first.")
    return SessionLocal

# Constructs a SQLAlchemy-compatible database URL based on current config
from urllib.parse import quote_plus

from sqlalchemy.engine import URL

def get_db_url():
    if db_config["engine"] == "mssql":
        driver = "ODBC Driver 18 for SQL Server"  # match what works in your local pyodbc
        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={db_config['host']};"
            f"DATABASE={db_config['database']};"
            f"UID={db_config['user']};"
            f"PWD={db_config['password']};"
            f"Encrypt=no;"
            f"TrustServerCertificate=no;"
            f"ApplicationIntent=ReadWrite;"
            f"Connect Timeout=30;"
        )

        return URL.create(
            "mssql+pyodbc",
            query={"odbc_connect": quote_plus(connection_string)}
        )

    else:
        # MySQL fallback
        return (
            f"mysql+mysqlconnector://{db_config['user']}:{db_config['password']}"
            f"@{db_config['host']}:{db_config['port']}/{db_config['database']}"
        )

def init_engine():
    global SessionLocal
    db_url = get_db_url()
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    set_engine(engine, SessionLocal)
    print("✅ Initialized engine for:", db_url)




# Returns the current DeepSeek API key
def get_deepseek_api_key():
    return db_config["deepseek_api_key"]


# Loads a profile from db_profiles.json by ID and reinitializes the DB engine
def load_profile_from_db_profiles(profile_id: int, filepath="db_profiles.json"):
    if not os.path.exists(filepath):
        raise FileNotFoundError("db_profiles.json not found")

    with open(filepath, "r") as f:
        profiles = json.load(f)

    selected = next((p for p in profiles if p["id"] == profile_id), None)
    if not selected:
        raise ValueError(f"No profile found with id {profile_id}")

    update_db_config(selected)
    init_engine()
    print(f"✅ Loaded profile ID {profile_id} → {selected['name']}")
    print("📦 Loaded config:", db_config)
