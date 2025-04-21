"""
Database session handling.
"""
import os
import time
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Import Prometheus metrics (lazy import to avoid circular dependencies)
def get_db_metrics():
    from app.core.prometheus import DB_QUERY_LATENCY
    return DB_QUERY_LATENCY

# Create SQLite database in the project directory
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "sqlite:///./valorant_sim.db"
)

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Add event listeners to track query execution time
@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_time = conn.info['query_start_time'].pop()
    total_time = time.time() - start_time
    
    # Extract operation type (SELECT, INSERT, UPDATE, DELETE)
    operation = statement.split()[0].lower() if statement else "unknown"
    
    # Extract table name - this is a simple approach and may need refinement
    table = "unknown"
    if "FROM" in statement:
        from_parts = statement.split("FROM")[1].strip().split()
        if from_parts:
            table = from_parts[0].strip('"`[]')
    elif "INTO" in statement:
        into_parts = statement.split("INTO")[1].strip().split()
        if into_parts:
            table = into_parts[0].strip('"`[]')
    elif "UPDATE" in statement:
        update_parts = statement.split("UPDATE")[1].strip().split()
        if update_parts:
            table = update_parts[0].strip('"`[]')
    
    # Record query execution time
    try:
        db_metrics = get_db_metrics()
        db_metrics.labels(operation=operation, table=table).observe(total_time)
    except Exception:
        # In case metrics are not yet initialized
        pass

# Dependency to get DB session
def get_db():
    """
    Get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 