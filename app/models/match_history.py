"""
Models for tracking match history and economy data.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class MatchHistory(Base):
    """Records of completed matches."""
    __tablename__ = "match_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Match metadata
    match_date = Column(DateTime, default=datetime.utcnow)
    map_name = Column(String)
    duration = Column(Float)  # in minutes
    
    # Teams
    team_a_name = Column(String, index=True)
    team_b_name = Column(String, index=True)
    
    # Results
    team_a_score = Column(Integer)
    team_b_score = Column(Integer)
    winner = Column(String)
    mvp_id = Column(String, nullable=True)
    
    # Detailed match data
    rounds_data = Column(JSON)  # Will store round-by-round data
    
    # Relationships
    economy_logs = relationship("EconomyLog", back_populates="match", cascade="all, delete-orphan")
    player_performances = relationship("MatchPerformance", back_populates="match", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Match {self.team_a_name} {self.team_a_score} - {self.team_b_score} {self.team_b_name}>"

class EconomyLog(Base):
    """Detailed economy logs for match rounds."""
    __tablename__ = "economy_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    match_id = Column(String, ForeignKey("match_history.id"))
    round_number = Column(Integer)
    
    # Team economy data
    team_a_economy_start = Column(Integer)
    team_b_economy_start = Column(Integer)
    team_a_economy_end = Column(Integer)
    team_b_economy_end = Column(Integer)
    
    # Economy changes
    team_a_spend = Column(Integer)
    team_b_spend = Column(Integer)
    team_a_reward = Column(Integer)
    team_b_reward = Column(Integer)
    
    # Round details
    winner = Column(String)
    spike_planted = Column(Boolean, default=False)
    
    # Notes and explanations
    notes = Column(Text, nullable=True)
    
    # Relationship
    match = relationship("MatchHistory", back_populates="economy_logs")
    
    def __repr__(self):
        return f"<EconomyLog Round {self.round_number}: {self.team_a_economy_start}->{self.team_a_economy_end} vs {self.team_b_economy_start}->{self.team_b_economy_end}>"

class MatchPerformance(Base):
    """Individual player performance in matches."""
    __tablename__ = "match_performances"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    match_id = Column(String, ForeignKey("match_history.id"))
    player_id = Column(String, index=True)
    team_name = Column(String)
    
    # Player info
    player_name = Column(String)  # firstName + lastName
    player_role = Column(String)
    
    # Core stats
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    
    # Advanced stats
    first_bloods = Column(Integer, default=0)
    clutches = Column(Integer, default=0)
    damage = Column(Integer, default=0)
    
    # Economy impact
    money_spent = Column(Integer, default=0)
    utility_usage = Column(Integer, default=0)
    
    # Relationship
    match = relationship("MatchHistory", back_populates="player_performances")
    
    def __repr__(self):
        return f"<Performance {self.player_name}: {self.kills}/{self.deaths}/{self.assists}>" 