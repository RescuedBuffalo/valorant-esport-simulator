"""
Player model representing a professional Valorant player.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional

@dataclass
class Player:
    """A professional Valorant player."""
    
    # Basic information
    name: str
    nationality: str
    age: int
    salary: int
    role: str  # Primary role: Duelist, Controller, Sentinel, Initiator
    
    # Proficiencies
    role_proficiency: Dict[str, int]  # Proficiency in each role (0-100)
    agent_proficiency: Dict[str, int]  # Proficiency with each agent (0-100)
    
    # Core stats (0-100)
    aim: int  # Raw aim skill
    game_sense: int  # Game understanding and decision making
    movement: int  # Movement and positioning skill
    utility_usage: int  # Ability to use abilities effectively
    communication: int  # Communication and teamwork
    clutch: int  # Performance in clutch situations
    
    # Dynamic stats
    form: int  # Current form (0-100)
    fatigue: int  # Current fatigue level (0-100)
    morale: int  # Current morale (0-100)
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    
    # Optional fields with defaults
    matches_played: int = 0
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    rounds_played: int = 0
    first_bloods: int = 0
    clutches_won: int = 0
    team_id: Optional[str] = None
    
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