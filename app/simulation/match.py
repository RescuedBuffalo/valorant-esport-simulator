"""
Simple dataclasses for match simulation without database dependencies.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any

class MatchStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MatchType(Enum):
    REGULAR = "regular"
    PLAYOFF = "playoff"
    FINAL = "final"

@dataclass
class MatchPerformance:
    """Track individual player performance in a match."""
    player_id: int
    team_id: int
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    acs: float = 0.0  # Average Combat Score
    adr: float = 0.0  # Average Damage per Round
    hs_pct: float = 0.0  # Headshot percentage
    first_kills: int = 0
    first_deaths: int = 0
    econ_rating: float = 0.0
    plants: int = 0
    defuses: int = 0
    clutches: int = 0
    impact_rating: float = 0.0

@dataclass
class SimMatch:
    """Represents a match for simulation purposes."""
    id: Optional[int] = None
    team1_id: Optional[int] = None
    team2_id: Optional[int] = None
    team1_name: str = ""
    team2_name: str = ""
    team1_score: int = 0
    team2_score: int = 0
    status: MatchStatus = MatchStatus.PENDING
    match_type: MatchType = MatchType.REGULAR
    map_name: str = "Haven"
    start_time: datetime = None
    end_time: datetime = None
    performances: List[MatchPerformance] = field(default_factory=list)
    rounds: List[Dict[str, Any]] = field(default_factory=list) 