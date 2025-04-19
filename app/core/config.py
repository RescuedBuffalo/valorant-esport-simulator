"""
Application configuration and environment variables.
"""
from typing import Any, Dict, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Valorant Esports Simulator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "valorant_sim"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Analytics
    MIXPANEL_TOKEN: str = "your-mixpanel-token"  # Change in production
    SENTRY_DSN: Optional[str] = None
    
    # Game Settings
    MAX_TEAM_SIZE: int = 7  # 5 main + 2 substitutes
    MIN_PLAYER_AGE: int = 16
    MAX_PLAYER_AGE: int = 35
    STARTING_BUDGET: float = 100000.0
    
    # Match Settings
    ROUNDS_TO_WIN: int = 13
    MAX_ROUNDS: int = 24
    OVERTIME_ROUNDS: int = 2
    
    # Feature Flags
    ENABLE_TOURNAMENTS: bool = True
    ENABLE_ACADEMY_TEAMS: bool = False
    ENABLE_CUSTOM_TOURNAMENTS: bool = False
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        
    @property
    def database_url(self) -> str:
        """Get database URL."""
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
            
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        )

settings = Settings() 