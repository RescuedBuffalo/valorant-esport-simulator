"""
Simple player dataclass for simulation without database dependencies.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

@dataclass
class Player:
    """Represents a player for simulation purposes."""
    id: str = ""
    firstName: str = ""
    lastName: str = ""
    age: int = 18
    nationality: str = ""
    region: str = ""
    primaryRole: str = ""
    salary: int = 50000
    rating: float = 75.0
    team_id: Optional[str] = None
    
    # Player skill attributes
    coreStats: Dict[str, float] = field(default_factory=dict)
    agentProficiencies: Dict[str, float] = field(default_factory=dict)
    roleProficiencies: Dict[str, float] = field(default_factory=dict)
    
    # Additional data
    contract: Dict[str, Any] = field(default_factory=dict)
    careerStats: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert player to dictionary representation."""
        return {
            'id': self.id,
            'firstName': self.firstName,
            'lastName': self.lastName,
            'age': self.age,
            'nationality': self.nationality,
            'region': self.region,
            'primaryRole': self.primaryRole,
            'salary': self.salary,
            'rating': self.rating,
            'team_id': self.team_id,
            'coreStats': self.coreStats,
            'agentProficiencies': self.agentProficiencies,
            'roleProficiencies': self.roleProficiencies,
            'contract': self.contract,
            'careerStats': self.careerStats
        } 