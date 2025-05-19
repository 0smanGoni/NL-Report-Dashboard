import json
import os
from fastapi import APIRouter, HTTPException

DB_PROFILE_FILE = "db_profiles.json"
db_profile_router = APIRouter()

def load_profiles():
    if os.path.exists(DB_PROFILE_FILE):
        with open(DB_PROFILE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_profiles(profiles):
    with open(DB_PROFILE_FILE, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2)

@db_profile_router.get("/profiles")
def get_profiles():
    return load_profiles()

@db_profile_router.post("/profiles")
def save_profile(profile: dict):
    profiles = load_profiles()
    profile["id"] = max([p["id"] for p in profiles], default=0) + 1
    profiles.append(profile)
    save_profiles(profiles)
    return {"status": "saved"}

@db_profile_router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int):
    profiles = load_profiles()
    updated = [p for p in profiles if p["id"] != profile_id]
    if len(updated) == len(profiles):
        raise HTTPException(status_code=404, detail="Profile not found")
    save_profiles(updated)
    return {"status": "deleted"}
