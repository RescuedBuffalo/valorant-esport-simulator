"""
Match model for simulating and tracking Valorant matches.
"""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class MatchStatus(enum.Enum):
    """Match status enumeration."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MatchType(enum.Enum):
    """Match type enumeration."""
    REGULAR = "regular"
    TOURNAMENT = "tournament"
    SHOWMATCH = "showmatch"
    SCRIM = "scrim"

class Match(Base):
    """Valorant match model."""
    __tablename__ = "matches"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Match Info
    tournament_id = Column(String, ForeignKey("tournaments.id"), nullable=True)
    match_type = Column(Enum(MatchType))
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    map_name = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    
    # Teams
    team_a_id = Column(String, ForeignKey("teams.id"))
    team_b_id = Column(String, ForeignKey("teams.id"))
    team_a_score = Column(Integer, default=0)
    team_b_score = Column(Integer, default=0)
    
    # Match Details
    rounds = Column(JSON, default=list)  # List of round results
    current_round = Column(Integer, default=0)
    overtime_rounds = Column(Integer, default=0)
    team_a_side_first = Column(String)  # "attack" or "defense"
    
    # Statistics
    team_a_stats = Column(JSON, default=dict)
    team_b_stats = Column(JSON, default=dict)
    mvp_player_id = Column(String, ForeignKey("players.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    team_a = relationship("Team", foreign_keys=[team_a_id], back_populates="home_matches")
    team_b = relationship("Team", foreign_keys=[team_b_id], back_populates="away_matches")
    tournament = relationship("Tournament", back_populates="matches")
    performances = relationship("MatchPerformance", back_populates="match")
    mvp = relationship("Player", foreign_keys=[mvp_player_id])

class MatchPerformance(Base):
    """Individual player performance in a match."""
    __tablename__ = "match_performances"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    match_id = Column(String, ForeignKey("matches.id"))
    player_id = Column(String, ForeignKey("players.id"))
    team_id = Column(String, ForeignKey("teams.id"))
    
    # Basic Stats
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    average_combat_score = Column(Float, default=0.0)
    
    # Advanced Stats
    first_bloods = Column(Integer, default=0)
    first_deaths = Column(Integer, default=0)
    clutches_won = Column(Integer, default=0)
    clutches_lost = Column(Integer, default=0)
    damage_dealt = Column(Integer, default=0)
    damage_received = Column(Integer, default=0)
    
    # Economy
    credits_spent = Column(Integer, default=0)
    credits_earned = Column(Integer, default=0)
    
    # Utility
    utility_damage = Column(Integer, default=0)
    utility_casts = Column(Integer, default=0)
    
    # Agent Info
    agent_played = Column(String)
    ultimate_points_earned = Column(Integer, default=0)
    ultimates_used = Column(Integer, default=0)
    
    # Round Impact
    entry_success_rate = Column(Float, default=0.0)
    trade_success_rate = Column(Float, default=0.0)
    rounds_played = Column(Integer, default=0)
    
    # Performance Rating
    rating = Column(Float, default=0.0)  # Overall performance rating (0-100)
    impact_score = Column(Float, default=0.0)  # Impact on match outcome
    
    # Relationships
    match = relationship("Match", back_populates="performances")
    player = relationship("Player", back_populates="match_performances")
    team = relationship("Team")
    
    @property
    def kd_ratio(self) -> float:
        """Calculate K/D ratio."""
        return self.kills / max(1, self.deaths)
    
    @property
    def kda_ratio(self) -> float:
        """Calculate KDA ratio."""
        return (self.kills + self.assists) / max(1, self.deaths)
    
    def calculate_rating(self):
        """Calculate overall performance rating."""
        # Base rating from KDA
        kda_rating = (self.kills * 2 + self.assists) / max(1, self.deaths) * 20
        
        # Impact rating from first bloods and clutches
        impact_rating = (
            self.first_bloods * 5 +
            self.clutches_won * 10 -
            self.first_deaths * 3
        ) / max(1, self.rounds_played) * 30
        
        # Utility rating
        utility_rating = (
            self.utility_damage / 100 +
            self.utility_casts / 10 +
            self.ultimates_used * 5
        ) / max(1, self.rounds_played) * 20
        
        # Economy rating
        economy_rating = (
            self.credits_earned / max(1, self.credits_spent) * 30
        )
        
        # Combine ratings
        self.rating = min(100, (
            kda_rating +
            impact_rating +
            utility_rating +
            economy_rating
        ))
        
        # Calculate impact score based on round wins and team performance
        self.impact_score = self.rating * (
            1 + self.clutches_won * 0.1 +
            self.first_bloods * 0.05
        ) 