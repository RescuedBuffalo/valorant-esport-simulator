"""
Weapon system for Valorant simulation.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

class WeaponType(Enum):
    SIDEARM = "sidearm"
    SMG = "smg"
    RIFLE = "rifle"
    SNIPER = "sniper"
    SHOTGUN = "shotgun"
    HEAVY = "heavy"

@dataclass
class Weapon:
    name: str
    type: WeaponType
    cost: int
    damage: float  # Base damage
    fire_rate: float  # Rounds per second
    range_multipliers: Dict[str, float]  # Damage multipliers for different ranges
    armor_penetration: float  # 0-1, percentage of damage that ignores armor
    accuracy: float  # Base accuracy (0-1)
    movement_accuracy: float  # Accuracy while moving (0-1)
    magazine_size: int
    reload_time: float  # Seconds
    equip_time: float  # Seconds
    wall_penetration: float  # 0-1, percentage of damage through walls

class WeaponFactory:
    """Factory for creating weapon instances with predefined stats."""
    
    @staticmethod
    def create_weapon_catalog() -> Dict[str, Weapon]:
        return {
            # Sidearms
            "Classic": Weapon(
                name="Classic",
                type=WeaponType.SIDEARM,
                cost=0,
                damage=26,
                fire_rate=6.75,
                range_multipliers={"close": 1.0, "medium": 0.8, "long": 0.6},
                armor_penetration=0.5,
                accuracy=0.8,
                movement_accuracy=0.6,
                magazine_size=12,
                reload_time=1.75,
                equip_time=0.75,
                wall_penetration=0.2
            ),
            "Sheriff": Weapon(
                name="Sheriff",
                type=WeaponType.SIDEARM,
                cost=800,
                damage=55,
                fire_rate=4.0,
                range_multipliers={"close": 1.0, "medium": 0.9, "long": 0.8},
                armor_penetration=0.75,
                accuracy=0.85,
                movement_accuracy=0.5,
                magazine_size=6,
                reload_time=2.25,
                equip_time=1.0,
                wall_penetration=0.5
            ),
            # SMGs
            "Spectre": Weapon(
                name="Spectre",
                type=WeaponType.SMG,
                cost=1600,
                damage=26,
                fire_rate=13.33,
                range_multipliers={"close": 1.2, "medium": 0.8, "long": 0.6},
                armor_penetration=0.6,
                accuracy=0.75,
                movement_accuracy=0.75,
                magazine_size=30,
                reload_time=2.25,
                equip_time=1.0,
                wall_penetration=0.4
            ),
            # Rifles
            "Vandal": Weapon(
                name="Vandal",
                type=WeaponType.RIFLE,
                cost=2900,
                damage=40,
                fire_rate=9.75,
                range_multipliers={"close": 1.0, "medium": 1.0, "long": 1.0},
                armor_penetration=0.8,
                accuracy=0.9,
                movement_accuracy=0.4,
                magazine_size=25,
                reload_time=2.5,
                equip_time=1.0,
                wall_penetration=0.8
            ),
            "Phantom": Weapon(
                name="Phantom",
                type=WeaponType.RIFLE,
                cost=2900,
                damage=39,
                fire_rate=11.0,
                range_multipliers={"close": 1.0, "medium": 0.9, "long": 0.8},
                armor_penetration=0.8,
                accuracy=0.95,
                movement_accuracy=0.45,
                magazine_size=30,
                reload_time=2.5,
                equip_time=1.0,
                wall_penetration=0.7
            ),
            # Snipers
            "Operator": Weapon(
                name="Operator",
                type=WeaponType.SNIPER,
                cost=4700,
                damage=150,
                fire_rate=0.75,
                range_multipliers={"close": 1.0, "medium": 1.0, "long": 1.0},
                armor_penetration=1.0,
                accuracy=1.0,
                movement_accuracy=0.1,
                magazine_size=5,
                reload_time=3.7,
                equip_time=1.5,
                wall_penetration=0.9
            ),
        }

class BuyPreferences:
    """Represents a player's weapon buying preferences and decision making."""
    
    def __init__(self, player_stats: Dict):
        self.player_stats = player_stats
        self.weapon_catalog = WeaponFactory.create_weapon_catalog()
        
    def decide_buy(self, available_credits: int, team_economy: float, round_type: str) -> Optional[str]:
        """
        Decide what weapon to buy based on available credits and situation.
        
        Args:
            available_credits: Credits available to spend
            team_economy: Average credits available to team (0-9000)
            round_type: Type of round (e.g., 'full_buy', 'eco', 'force_buy')
            
        Returns:
            Name of weapon to buy or None for no buy
        """
        if round_type == 'eco':
            return self._eco_buy(available_credits)
        elif round_type == 'force_buy':
            return self._force_buy(available_credits)
        else:
            return self._full_buy(available_credits)
    
    def _eco_buy(self, credits: int) -> Optional[str]:
        """Logic for eco round buying."""
        if credits >= 800 and self.player_stats['coreStats']['aim'] > 80:
            return 'Sheriff'  # High skill players might buy Sheriff on eco
        return 'Classic'  # Default to Classic
    
    def _force_buy(self, credits: int) -> Optional[str]:
        """Logic for force buy rounds."""
        if credits >= 1600:
            return 'Spectre'  # Spectre is a good force buy option
        return self._eco_buy(credits)
    
    def _full_buy(self, credits: int) -> Optional[str]:
        """Logic for full buy rounds."""
        if credits >= 4700 and self.player_stats['coreStats']['aim'] > 85:
            return 'Operator'  # High skill players might opt for Operator
        elif credits >= 2900:
            # Choose between Vandal and Phantom based on player stats
            if self.player_stats['coreStats']['aim'] > self.player_stats['coreStats']['utilityUsage']:
                return 'Vandal'  # Better for raw aim players
            return 'Phantom'  # Better for utility/spray focused players
        return self._force_buy(credits)  # Fall back to force buy logic if can't afford full buy 