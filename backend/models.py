from sqlalchemy import Column, Integer, String, Text, JSON, Enum, TIMESTAMP, func
from db import Base

class SavedReport(Base):
    __tablename__ = "saved_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    original_prompt = Column(Text)
    sql_query = Column(Text)
    json_result = Column(JSON)
    summary = Column(Text)
    chart_type = Column(Enum("bar", "line", "pie", "table"))
    created_at = Column(TIMESTAMP, server_default=func.now())
