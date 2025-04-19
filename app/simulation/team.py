"""
Simple team dataclass for simulation without database dependencies.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

@dataclass
class Team:
    """Represents a team for simulation purposes."""
    id: str = ""
    name: str = ""
    region: str = ""
    rating: float = 75.0
    chemistry: float = 70.0
    budget: int = 1000000
    current_balance: int = 500000
    win_count: int = 0
    loss_count: int = 0
    
    # Roster is a list of player IDs
    roster: List[str] = field(default_factory=list)
    
    # Strategy and training preferences
    strategy_preferences: Dict[str, float] = field(default_factory=dict)
    training_focus: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert team to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'region': self.region,
            'rating': self.rating,
            'chemistry': self.chemistry,
            'budget': self.budget,
            'current_balance': self.current_balance,
            'win_count': self.win_count,
            'loss_count': self.loss_count,
            'roster': self.roster,
            'strategy_preferences': self.strategy_preferences,
            'training_focus': self.training_focus
        } 