"""
Tournament model for managing Valorant esports tournaments.
"""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class TournamentTier(enum.Enum):
    """Tournament tier enumeration."""
    S = "s_tier"  # International majors
    A = "a_tier"  # Regional majors
    B = "b_tier"  # Regional qualifiers
    C = "c_tier"  # Minor tournaments
    D = "d_tier"  # Local tournaments

class TournamentStatus(enum.Enum):
    """Tournament status enumeration."""
    ANNOUNCED = "announced"
    REGISTRATION = "registration"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TournamentFormat(enum.Enum):
    """Tournament format enumeration."""
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"
    GROUP_STAGE = "group_stage"

class Tournament(Base):
    """Valorant tournament model."""
    __tablename__ = "tournaments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Basic Info
    name = Column(String)
    tier = Column(Enum(TournamentTier))
    status = Column(Enum(TournamentStatus), default=TournamentStatus.ANNOUNCED)
    format = Column(Enum(TournamentFormat))
    region = Column(String)
    
    # Dates
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    registration_deadline = Column(DateTime)
    
    # Prize Pool
    total_prize_pool = Column(Float)
    prize_distribution = Column(JSON)  # Distribution percentages
    
    # Tournament Details
    max_teams = Column(Integer)
    current_teams = Column(Integer, default=0)
    format_details = Column(JSON)  # Specific format configuration
    rules = Column(JSON)  # Tournament rules
    maps_pool = Column(JSON)  # Available maps
    
    # Qualification
    qualification_points = Column(Integer)  # Points awarded for circuit
    minimum_team_rating = Column(Float, nullable=True)  # Minimum team rating to participate
    is_qualifier = Column(Boolean, default=False)
    qualifier_for = Column(String, ForeignKey("tournaments.id"), nullable=True)
    
    # Statistics
    total_matches = Column(Integer, default=0)
    completed_matches = Column(Integer, default=0)
    viewers_peak = Column(Integer, default=0)
    average_viewers = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    matches = relationship("Match", back_populates="tournament")
    participants = relationship("TournamentParticipation", back_populates="tournament")
    qualifies_for = relationship("Tournament", remote_side=[id])

class TournamentParticipation(Base):
    """Team participation in a tournament."""
    __tablename__ = "tournament_participations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    team_id = Column(String, ForeignKey("teams.id"))
    
    # Participation Details
    registration_date = Column(DateTime, default=datetime.utcnow)
    seed = Column(Integer, nullable=True)
    group = Column(String, nullable=True)
    is_qualified = Column(Boolean, default=True)
    qualifier_points = Column(Integer, default=0)
    
    # Tournament Progress
    current_position = Column(Integer, nullable=True)
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    rounds_won = Column(Integer, default=0)
    rounds_lost = Column(Integer, default=0)
    
    # Prize
    prize_money = Column(Float, default=0.0)
    circuit_points = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tournament = relationship("Tournament", back_populates="participants")
    team = relationship("Team", back_populates="tournament_participations")
    
    @property
    def match_win_rate(self) -> float:
        """Calculate match win rate."""
        total_matches = self.matches_won + self.matches_lost
        return self.matches_won / max(1, total_matches) * 100
    
    @property
    def round_win_rate(self) -> float:
        """Calculate round win rate."""
        total_rounds = self.rounds_won + self.rounds_lost
        return self.rounds_won / max(1, total_rounds) * 100
    
    def award_prize(self, position: int):
        """Award prize money and points based on final position."""
        if not self.tournament.prize_distribution:
            return
            
        distribution = self.tournament.prize_distribution
        if str(position) in distribution:
            percentage = distribution[str(position)]
            self.prize_money = self.tournament.total_prize_pool * (percentage / 100)
            
        # Award circuit points based on tournament tier and position
        tier_multipliers = {
            TournamentTier.S: 1.0,
            TournamentTier.A: 0.7,
            TournamentTier.B: 0.4,
            TournamentTier.C: 0.2,
            TournamentTier.D: 0.1
        }
        
        base_points = max(0, 16 - position)  # 1st = 15 points, 2nd = 14 points, etc.
        multiplier = tier_multipliers.get(self.tournament.tier, 0.1)
        self.circuit_points = int(base_points * multiplier * 100) 