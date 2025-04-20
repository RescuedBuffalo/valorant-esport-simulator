"""
Maps module for Valorant map definitions and visualizations.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple, Any, Optional

class MapArea(Enum):
    """Types of areas on a Valorant map."""
    ATTACKER_SPAWN = "attacker_spawn"
    DEFENDER_SPAWN = "defender_spawn"
    A_SITE = "a_site"
    B_SITE = "b_site"
    C_SITE = "c_site" 
    MID = "mid"
    CONNECTOR = "connector"
    FLANK = "flank"

@dataclass
class MapCallout:
    """Represents a specific named location on a map."""
    name: str
    area_type: MapArea
    position: Tuple[float, float]  # x, y coordinates (0-1 scale)
    size: Tuple[float, float]  # width, height (0-1 scale)
    description: str = ""
    typical_roles: List[str] = field(default_factory=list)  # e.g., ["Sentinel", "Controller"]

@dataclass
class SpawnPoint:
    team: str  # "attackers" or "defenders"
    x: float
    y: float

@dataclass
class StrategicPoint:
    name: str
    x: float
    y: float
    type: str  # "entry", "control", "rotate", "flank"
    description: str

@dataclass
class MapLayout:
    """Defines the layout of a Valorant map."""
    id: str
    name: str
    image_url: str  # Path to the map image
    width: int  # Actual pixel width of the map image
    height: int  # Actual pixel height of the map image
    callouts: Dict[str, MapCallout] = field(default_factory=dict)
    sites: List[str] = field(default_factory=list)  # e.g., ["A", "B"] or ["A", "B", "C"]
    attacker_spawn: Tuple[float, float] = (0, 0)  # Default position
    defender_spawn: Tuple[float, float] = (0, 0)  # Default position
    strategic_points: List[StrategicPoint] = field(default_factory=list)
    spawn_points: List[SpawnPoint] = field(default_factory=list)
    areas: List[Dict] = field(default_factory=list)  # List of polygon areas with type

class MapCollection:
    """Collection of all available Valorant maps."""
    
    def __init__(self):
        self.maps: Dict[str, MapLayout] = {}
    
    def add_map(self, map_layout: MapLayout) -> None:
        """Add a map to the collection."""
        self.maps[map_layout.name] = map_layout
    
    def get_map(self, map_name: str) -> Optional[MapLayout]:
        """Get a map by name."""
        return self.maps.get(map_name)
    
    def get_all_map_names(self) -> List[str]:
        """Get a list of all available map names."""
        return list(self.maps.keys())

# Create the map collection instance for imports
map_collection = MapCollection() 