"""
Team model representing a professional Valorant esports organization.
"""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.models.match import Match  # Add import for Match

class Team(Base):
    """Professional Valorant team model."""
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Basic Info
    name = Column(String, unique=True)
    tag = Column(String, unique=True)  # Short team tag (e.g., "TSM", "100T")
    region = Column(String)
    founded_date = Column(DateTime, default=datetime.utcnow)
    
    # Financial
    budget = Column(Float)
    weekly_salary_cap = Column(Float)
    sponsor_income = Column(Float, default=0.0)
    merchandise_income = Column(Float, default=0.0)
    
    # Facilities
    facility_level = Column(Integer, default=1)
    training_quality = Column(Float, default=50.0)
    staff_quality = Column(Float, default=50.0)
    
    # Performance Metrics
    reputation = Column(Float, default=50.0)
    global_ranking = Column(Integer, nullable=True)  # Make nullable to avoid initialization errors
    regional_ranking = Column(Integer, nullable=True)  # Make nullable to avoid initialization errors
    tournament_wins = Column(Integer, default=0)
    match_wins = Column(Integer, default=0)
    match_losses = Column(Integer, default=0)
    
    # Team Stats
    playstyle = Column(JSON)  # Preferred strategies and playstyles
    map_stats = Column(JSON)  # Performance on different maps
    
    # Academy
    has_academy_team = Column(Boolean, default=False)
    academy_team_id = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    players = relationship("Player", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.team_a_id", back_populates="team_a")
    away_matches = relationship("Match", foreign_keys="Match.team_b_id", back_populates="team_b")
    tournament_participations = relationship("TournamentParticipation", back_populates="team")
    
    @property
    def active_roster(self) -> List["Player"]:
        """Get the team's active roster."""
        return [p for p in self.players if p.is_starter]
    
    @property
    def substitutes(self) -> List["Player"]:
        """Get the team's substitute players."""
        return [p for p in self.players if not p.is_starter]
    
    @property
    def team_chemistry(self) -> float:
        """Calculate team chemistry based on various factors."""
        if not self.players:
            return 0.0
            
        # Base chemistry from player personalities
        personality_compatibility = self._calculate_personality_compatibility()
        
        # Time played together bonus
        time_bonus = self._calculate_time_bonus()
        
        # Role synergy
        role_synergy = self._calculate_role_synergy()
        
        # Facility and staff contribution
        facility_bonus = (self.facility_level * 5 + self.training_quality * 0.2 +
                        self.staff_quality * 0.2)
        
        # Weighted sum of all factors
        chemistry = (
            personality_compatibility * 0.3 +
            time_bonus * 0.2 +
            role_synergy * 0.3 +
            facility_bonus * 0.2
        )
        
        return max(0, min(100, chemistry))
    
    def _calculate_personality_compatibility(self) -> float:
        """Calculate how well player personalities mesh together."""
        if len(self.active_roster) < 2:
            return 70.0  # Default compatibility
            
        compatibility_sum = 0
        comparisons = 0
        
        for i, player1 in enumerate(self.active_roster):
            for player2 in self.active_roster[i+1:]:
                compatibility = self._get_personality_compatibility(
                    player1.personality,
                    player2.personality
                )
                compatibility_sum += compatibility
                comparisons += 1
        
        return compatibility_sum / comparisons if comparisons > 0 else 70.0
    
    def _calculate_time_bonus(self) -> float:
        """Calculate bonus from time played together."""
        if not self.active_roster:
            return 0.0
            
        # Average time players have been on the team
        total_days = sum(
            (datetime.utcnow() - player.created_at).days
            for player in self.active_roster
        )
        avg_days = total_days / len(self.active_roster)
        
        # Max bonus for 365 days (1 year) together
        return min(100, (avg_days / 365) * 100)
    
    def _calculate_role_synergy(self) -> float:
        """Calculate how well the team's roles complement each other."""
        if len(self.active_roster) < 5:
            return 50.0
            
        role_counts = {
            'Duelist': 0,
            'Controller': 0,
            'Sentinel': 0,
            'Initiator': 0
        }
        
        # Count primary roles
        for player in self.active_roster:
            primary_role = max(
                player.role_proficiency.items(),
                key=lambda x: x[1]
            )[0]
            role_counts[primary_role] = role_counts.get(primary_role, 0) + 1
        
        # Ideal composition: 1-2 Duelists, 1 Controller, 1-2 Sentinels, 1-2 Initiators
        synergy = 100.0
        
        if role_counts['Controller'] != 1:
            synergy -= 20
        if role_counts['Duelist'] < 1 or role_counts['Duelist'] > 2:
            synergy -= 15
        if role_counts['Sentinel'] < 1 or role_counts['Sentinel'] > 2:
            synergy -= 15
        if role_counts['Initiator'] < 1 or role_counts['Initiator'] > 2:
            synergy -= 15
            
        return max(0, synergy)
    
    @staticmethod
    def _get_personality_compatibility(p1: Dict, p2: Dict) -> float:
        """Calculate compatibility between two personalities."""
        # Simplified compatibility calculation
        compatibility = 70.0  # Base compatibility
        
        # Example personality traits and their impact
        traits = ['leadership', 'communication', 'aggression', 'adaptability']
        
        for trait in traits:
            if trait in p1 and trait in p2:
                # Penalize big differences in traits
                diff = abs(p1[trait] - p2[trait])
                compatibility -= diff * 0.5
        
        return max(0, min(100, compatibility))
    
    def update_reputation(self, match_result: str, opponent_reputation: float):
        """Update team reputation based on match results."""
        reputation_change = {
            'win': 5,
            'loss': -3,
            'draw': 1
        }.get(match_result, 0)
        
        # Modify change based on opponent's reputation
        reputation_diff = opponent_reputation - self.reputation
        modifier = 0.5 if reputation_diff > 0 else 0.2
        
        final_change = reputation_change * (1 + abs(reputation_diff) * modifier)
        self.reputation = max(0, min(100, self.reputation + final_change))
    
    def pay_salaries(self) -> float:
        """Pay weekly salaries to players and return total cost."""
        return sum(player.salary for player in self.players) 