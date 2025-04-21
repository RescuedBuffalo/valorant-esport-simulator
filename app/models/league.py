"""
League model representing a collection of teams and players competing in a circuit.
"""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base_class import Base

# Association table for League-Team relationship (many-to-many)
league_team_association = Table(
    'league_teams',
    Base.metadata,
    Column('league_id', String, ForeignKey('leagues.id')),
    Column('team_id', String, ForeignKey('teams.id')),
    # Teams must be unique within a league
    UniqueConstraint('league_id', 'team_id', name='unique_team_in_league')
)

# Association table for League-Player relationship with team context
# This allows a player to be in multiple leagues but only with one team per league
league_player_association = Table(
    'league_players',
    Base.metadata,
    Column('league_id', String, ForeignKey('leagues.id')),
    Column('player_id', String, ForeignKey('players.id')),
    Column('team_id', String, ForeignKey('teams.id')),
    # Players must be unique within a league
    UniqueConstraint('league_id', 'player_id', name='unique_player_in_league')
)

class League(Base):
    """League model representing a competitive circuit."""
    __tablename__ = "leagues"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Basic info
    name = Column(String, unique=True)
    description = Column(String, nullable=True)
    region = Column(String)
    prize_pool = Column(Float, default=0.0)
    tier = Column(Integer, default=1)  # 1 = Major, 2 = Minor, 3 = Regional, etc.
    logo_url = Column(String, nullable=True)
    
    # Configuration
    max_teams = Column(Integer, default=12)
    seasons_per_year = Column(Integer, default=2)
    current_season = Column(Integer, default=1)
    active = Column(Boolean, default=True)
    
    # Format details
    format = Column(JSON)  # Details about league format, playoff structure, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Relationships
    teams = relationship(
        "Team",
        secondary=league_team_association,
        backref="leagues"
    )
    
    # League players relationship through the association table
    players = relationship(
        "Player",
        secondary=league_player_association,
        backref="leagues"
    )
    
    @property
    def team_count(self) -> int:
        """Get the number of teams in the league."""
        return len(self.teams)
    
    @property
    def player_count(self) -> int:
        """Get the number of players in the league."""
        return len(self.players)
    
    def to_dict(self):
        """Convert to dictionary representation for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "region": self.region,
            "prize_pool": self.prize_pool,
            "tier": self.tier,
            "logo_url": self.logo_url,
            "max_teams": self.max_teams,
            "seasons_per_year": self.seasons_per_year,
            "current_season": self.current_season,
            "active": self.active,
            "format": self.format,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "team_count": self.team_count,
            "player_count": self.player_count
        }

class Circuit(Base):
    """Circuit model representing a specific competition within a league."""
    __tablename__ = "circuits"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Basic info
    name = Column(String)
    description = Column(String, nullable=True)
    league_id = Column(String, ForeignKey("leagues.id"))
    season = Column(Integer, default=1)
    stage = Column(String)  # e.g., "Regular Season", "Playoffs", "Finals"
    prize_pool = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # Relationships
    league = relationship("League", backref="circuits")
    
    # Additional format details specific to this circuit
    format = Column(JSON)  # E.g., round-robin, single elimination, etc.
    
    def to_dict(self):
        """Convert to dictionary representation for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "league_id": self.league_id,
            "season": self.season,
            "stage": self.stage,
            "prize_pool": self.prize_pool,
            "format": self.format,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None
        } 