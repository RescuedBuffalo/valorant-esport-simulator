"""
Player model representing a professional Valorant player.
"""
from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.models.team import Team

class Player(Base):
    """Professional Valorant player model."""
    __tablename__ = "players"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Basic Information
    first_name = Column(String)
    last_name = Column(String)
    gamer_tag = Column(String)
    age = Column(Integer)
    nationality = Column(String)
    region = Column(String)
    primary_role = Column(String)  # Duelist, Controller, Sentinel, Initiator
    salary = Column(Integer)
    
    # Team relationship
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    team = relationship("Team", back_populates="players")
    is_starter = Column(Boolean, default=True)
    
    # Core stats (0-100)
    aim = Column(Float, default=50.0)
    game_sense = Column(Float, default=50.0)
    movement = Column(Float, default=50.0)
    utility_usage = Column(Float, default=50.0)
    communication = Column(Float, default=50.0)
    clutch = Column(Float, default=50.0)
    
    # Proficiencies
    role_proficiencies = Column(JSON, default=dict)  # Dict[str, float]
    agent_proficiencies = Column(JSON, default=dict)  # Dict[str, float]
    
    # Dynamic stats
    form = Column(Float, default=75.0)
    fatigue = Column(Float, default=0.0)
    morale = Column(Float, default=75.0)
    
    # Career stats
    matches_played = Column(Integer, default=0)
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    rounds_played = Column(Integer, default=0)
    first_bloods = Column(Integer, default=0)
    clutches_won = Column(Integer, default=0)
    win_count = Column(Integer, default=0)
    loss_count = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    match_performances = relationship("app.models.match.MatchPerformanceModel", primaryjoin="Player.id==app.models.match.MatchPerformanceModel.player_id", 
                                     foreign_keys="app.models.match.MatchPerformanceModel.player_id")
    
    @property
    def kd_ratio(self) -> float:
        """Calculate kill/death ratio."""
        return self.kills / max(1, self.deaths)
    
    @property
    def kda_ratio(self) -> float:
        """Calculate kill/death/assist ratio."""
        return (self.kills + self.assists) / max(1, self.deaths)
    
    @property
    def first_blood_percentage(self) -> float:
        """Calculate percentage of kills that were first bloods."""
        if self.kills == 0:
            return 0.0
        return (self.first_bloods / self.kills) * 100
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage."""
        total_matches = self.win_count + self.loss_count
        if total_matches == 0:
            return 0.0
        return (self.win_count / total_matches) * 100
    
    @property
    def average_combat_score(self) -> float:
        """Calculate average combat score per round."""
        # Simple approximation of combat score
        total_score = (
            self.kills * 200 +  # Base kill score
            self.assists * 50 +  # Assist score
            self.first_bloods * 100 +  # First blood bonus
            self.clutches_won * 300  # Clutch bonus
        )
        return total_score / max(1, self.rounds_played)
    
    def update_form(self, match_rating: float):
        """Update player's form based on recent match performance."""
        # Form is influenced by match rating (0-100) with some inertia
        form_change = (match_rating - self.form) * 0.3
        self.form = max(0, min(100, self.form + form_change))
    
    def rest(self):
        """Allow player to rest, reducing fatigue."""
        self.fatigue = max(0, self.fatigue - 30)
        self.form = min(100, self.form + 5)
    
    def update_morale(self, won_match: bool):
        """Update player's morale based on match result."""
        morale_change = 10 if won_match else -10
        self.morale = max(0, min(100, self.morale + morale_change))
    
    def get_performance_rating(self) -> float:
        """Calculate overall performance rating (0-100)."""
        # Base rating from core stats
        base_rating = (
            self.aim * 0.25 +
            self.game_sense * 0.25 +
            self.movement * 0.15 +
            self.utility_usage * 0.15 +
            self.communication * 0.1 +
            self.clutch * 0.1
        )
        
        # Apply form and fatigue modifiers
        form_modifier = (self.form / 100.0) * 0.2
        fatigue_modifier = ((100 - self.fatigue) / 100.0) * 0.1
        morale_modifier = (self.morale / 100.0) * 0.1
        
        return base_rating * (1 + form_modifier - fatigue_modifier + morale_modifier)
    
    def to_dict(self):
        """Convert to dictionary representation for API responses."""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "gamerTag": self.gamer_tag,
            "age": self.age,
            "nationality": self.nationality,
            "region": self.region,
            "primaryRole": self.primary_role,
            "salary": self.salary,
            "coreStats": {
                "aim": self.aim,
                "gameSense": self.game_sense,
                "movement": self.movement,
                "utilityUsage": self.utility_usage,
                "communication": self.communication,
                "clutch": self.clutch
            },
            "roleProficiencies": self.role_proficiencies,
            "agentProficiencies": self.agent_proficiencies,
            "careerStats": {
                "matchesPlayed": self.matches_played,
                "kills": self.kills,
                "deaths": self.deaths,
                "assists": self.assists,
                "firstBloods": self.first_bloods,
                "clutches": self.clutches_won,
                "winRate": self.win_rate,
                "kdRatio": self.kd_ratio,
                "kdaRatio": self.kda_ratio,
                "firstBloodRate": self.first_blood_percentage,
                "clutchRate": self.clutches_won / max(1, self.matches_played) * 100
            },
            "form": self.form,
            "fatigue": self.fatigue,
            "morale": self.morale,
            "isStarter": self.is_starter,
            "teamId": self.team_id
        } 