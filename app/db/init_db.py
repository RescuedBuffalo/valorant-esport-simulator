"""
Database initialization script.
"""
import logging
from sqlalchemy.orm import Session

from app.db.session import engine, SessionLocal
from app.models import team, player, match_history, tournament, match

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    """Initialize database tables."""
    logger.info("Creating database tables...")
    
    # Create tables in the correct order to respect foreign key relationships
    team.Base.metadata.create_all(bind=engine)
    player.Base.metadata.create_all(bind=engine)
    tournament.Base.metadata.create_all(bind=engine)
    match.Base.metadata.create_all(bind=engine)
    match_history.Base.metadata.create_all(bind=engine)
    
    logger.info("Database tables created successfully!")

def main() -> None:
    """Run database initialization."""
    init_db()
    
    # Check if tables were created successfully
    db = SessionLocal()
    try:
        # Test connection
        logger.info("Testing database connection...")
        db.execute("SELECT 1")
        logger.info("Database connection successful!")
        
        # Log created tables
        tables = [table_name for table_name, _ in engine.dialect.get_table_names(db.connection())]
        logger.info(f"Available tables: {tables}")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 