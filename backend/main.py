from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from db_profile_routes import db_profile_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(db_profile_router)
