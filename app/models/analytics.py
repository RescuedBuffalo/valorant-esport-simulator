"""
Database models for analytics data.
"""
from datetime import datetime
from typing import Dict, Any

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class UserSession(Base):
    """User session data."""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    session_id = Column(String, unique=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    ip_address = Column(String)
    user_agent = Column(String)
    referrer = Column(String, nullable=True)
    
    events = relationship("GameEvent", back_populates="session")

class GameEvent(Base):
    """Game event data."""
    __tablename__ = "game_events"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    event_type = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    properties = Column(JSON)
    
    session = relationship("UserSession", back_populates="events")

class MatchAnalytics(Base):
    """Match-specific analytics."""
    __tablename__ = "match_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(String, index=True)
    user_id = Column(String, index=True)
    team_a_score = Column(Integer)
    team_b_score = Column(Integer)
    map_name = Column(String)
    duration_seconds = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    additional_data = Column(JSON)

class TeamAnalytics(Base):
    """Team progression analytics."""
    __tablename__ = "team_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String, index=True)
    user_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    reputation = Column(Float)
    budget = Column(Float)
    tournament_wins = Column(Integer)
    player_count = Column(Integer)
    average_player_rating = Column(Float)
    facility_level = Column(Integer)

class PlayerTransaction(Base):
    """Player transfer and contract analytics."""
    __tablename__ = "player_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    player_id = Column(String, index=True)
    transaction_type = Column(String)  # transfer, contract_renewal, release
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON)

class FeatureUsage(Base):
    """Feature usage analytics."""
    __tablename__ = "feature_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    feature_name = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    usage_count = Column(Integer, default=1)
    last_used = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON) 