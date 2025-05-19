from sqlalchemy.orm import declarative_base

Base = declarative_base()

# These will be initialized later via config.py
engine = None
SessionLocal = None

# This allows config.py to assign to these from outside
def set_engine(e, session_factory):
    global engine, SessionLocal
    engine = e
    SessionLocal = session_factory
