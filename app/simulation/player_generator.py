"""
Player generation system for creating realistic Valorant professional players.
"""
from typing import Dict, List, Optional
import random
import names
import numpy as np
from datetime import datetime, timedelta

from app.models.player import Player

class PlayerGenerator:
    """Generates realistic Valorant professional players with appropriate attributes."""
    
    # Constants for player generation
    MIN_AGE = 16
    MAX_AGE = 30
    BASE_SALARY = 50000  # Base annual salary
    MIN_ROSTER_SIZE = 1
    
    # Regions and their associated countries
    REGIONS = {
        'NA': ['USA', 'Canada', 'Mexico'],
        'EU': ['France', 'Germany', 'UK', 'Spain', 'Sweden', 'Denmark', 'Poland', 'Turkey'],
        'KR': ['South Korea'],
        'JP': ['Japan'],
        'BR': ['Brazil'],
        'LATAM': ['Argentina', 'Chile', 'Colombia'],
        'APAC': ['Thailand', 'Indonesia', 'Philippines', 'Singapore', 'Malaysia']
    }
    
    # Agent roles and their typical agents
    AGENT_ROLES = {
        'Duelist': ['Jett', 'Raze', 'Reyna', 'Phoenix', 'Neon', 'Yoru', 'ISO'],
        'Controller': ['Omen', 'Brimstone', 'Viper', 'Astra', 'Harbor'],
        'Sentinel': ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock'],
        'Initiator': ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko']
    }
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize the player generator with an optional seed for reproducibility."""
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
    
    def generate_player(
        self,
        region: Optional[str] = None,
        role: Optional[str] = None,
        min_rating: int = 60,
        max_rating: int = 95
    ) -> Player:
        """Generate a single player with the specified constraints."""
        # Validate inputs
        if region is not None and region not in self.REGIONS:
            raise ValueError(f"Invalid region: {region}. Must be one of {list(self.REGIONS.keys())}")
        if role is not None and role not in self.AGENT_ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {list(self.AGENT_ROLES.keys())}")
        if min_rating < 0 or min_rating > 100:
            raise ValueError("min_rating must be between 0 and 100")
        if max_rating < 0 or max_rating > 100:
            raise ValueError("max_rating must be between 0 and 100")
        if min_rating > max_rating:
            raise ValueError("min_rating cannot be greater than max_rating")
        
        # Generate basic info
        region = region or random.choice(list(self.REGIONS.keys()))
        nationality = random.choice(self.REGIONS[region])
        age = random.randint(self.MIN_AGE, self.MAX_AGE)
        
        # Generate name (using names library)
        name = names.get_full_name(gender='male')  # Currently pro scene is predominantly male
        
        # Determine primary role and proficiencies
        primary_role = role or random.choice(list(self.AGENT_ROLES.keys()))
        role_proficiencies = self._generate_role_proficiencies(primary_role)
        
        # Generate core stats with role-specific biases
        core_stats = self._generate_core_stats(primary_role, min_rating, max_rating)
        
        # Generate agent proficiencies based on role
        agent_proficiencies = self._generate_agent_proficiencies(primary_role, role_proficiencies[primary_role])
        
        # Calculate salary based on stats and experience
        salary = self._calculate_salary(core_stats, age)
        
        # Create the player
        player = Player(
            name=name,
            nationality=nationality,
            age=age,
            salary=salary,
            role=primary_role,
            role_proficiency=role_proficiencies,
            agent_proficiency=agent_proficiencies,
            # Core stats
            aim=core_stats['aim'],
            game_sense=core_stats['game_sense'],
            movement=core_stats['movement'],
            utility_usage=core_stats['utility_usage'],
            communication=core_stats['communication'],
            clutch=core_stats['clutch'],
            # Dynamic stats
            form=random.randint(65, 85),
            fatigue=random.randint(0, 30),
            morale=random.randint(70, 90),
            # Career stats (for new player)
            matches_played=random.randint(50, 200),
            kills=0,
            deaths=0,
            assists=0,
            rounds_played=0,
            first_bloods=0,
            clutches_won=0,
            # Additional attributes
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Initialize career stats based on matches played
        self._initialize_career_stats(player)
        
        return player
    
    def generate_team_roster(
        self,
        region: str,
        min_rating: int = 70,
        max_rating: int = 90,
        roster_size: int = 5
    ) -> List[Player]:
        """Generate a balanced team roster with appropriate role distribution."""
        # Validate inputs
        if region not in self.REGIONS:
            raise ValueError(f"Invalid region: {region}. Must be one of {list(self.REGIONS.keys())}")
        if roster_size < self.MIN_ROSTER_SIZE:
            raise ValueError(f"roster_size must be at least {self.MIN_ROSTER_SIZE}")
        
        roster = []
        
        # Ensure core roles are filled
        required_roles = ['Duelist', 'Controller', 'Sentinel', 'Initiator']
        random.shuffle(required_roles)
        
        # Generate players for core roles
        for role in required_roles[:min(roster_size, len(required_roles))]:
            player = self.generate_player(
                region=region,
                role=role,
                min_rating=min_rating,
                max_rating=max_rating
            )
            roster.append(player)
        
        # Add remaining players with flexible roles
        while len(roster) < roster_size:
            player = self.generate_player(
                region=region,
                min_rating=min_rating,
                max_rating=max_rating
            )
            roster.append(player)
        
        return roster
    
    def _generate_role_proficiencies(self, primary_role: str) -> Dict[str, int]:
        """Generate proficiency levels for all roles."""
        if primary_role not in self.AGENT_ROLES:
            raise ValueError(f"Invalid role: {primary_role}. Must be one of {list(self.AGENT_ROLES.keys())}")
        
        proficiencies = {}
        
        # Primary role gets highest proficiency
        proficiencies[primary_role] = random.randint(80, 95)
        
        # Other roles get lower proficiencies
        for role in self.AGENT_ROLES.keys():
            if role != primary_role:
                proficiencies[role] = random.randint(50, 75)
        
        return proficiencies
    
    def _generate_core_stats(self, role: str, min_rating: int, max_rating: int) -> Dict[str, int]:
        """Generate core player statistics with role-specific biases."""
        if role not in self.AGENT_ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {list(self.AGENT_ROLES.keys())}")
        
        # Validate rating range
        if min_rating < 0 or min_rating > 100:
            raise ValueError("min_rating must be between 0 and 100")
        if max_rating < 0 or max_rating > 100:
            raise ValueError("max_rating must be between 0 and 100")
        if min_rating > max_rating:
            raise ValueError("min_rating cannot be greater than max_rating")
        
        stats = {}
        role_bonus = 5  # Bonus for role-specific stats
        
        # Base ranges for each stat
        ranges = {
            'aim': (min_rating, max_rating),
            'game_sense': (min_rating, max_rating),
            'movement': (min_rating, max_rating),
            'utility_usage': (min_rating, max_rating),
            'communication': (min_rating, max_rating),
            'clutch': (min_rating, max_rating)
        }
        
        # Apply role-specific biases, ensuring we don't exceed max_rating
        if role == 'Duelist':
            ranges['aim'] = (min(min_rating + role_bonus, max_rating), max_rating)
            ranges['movement'] = (min(min_rating + role_bonus, max_rating), max_rating)
        elif role == 'Controller':
            ranges['utility_usage'] = (min(min_rating + role_bonus, max_rating), max_rating)
            ranges['game_sense'] = (min(min_rating + role_bonus, max_rating), max_rating)
        elif role == 'Sentinel':
            ranges['game_sense'] = (min(min_rating + role_bonus, max_rating), max_rating)
            ranges['clutch'] = (min(min_rating + role_bonus, max_rating), max_rating)
        elif role == 'Initiator':
            ranges['utility_usage'] = (min(min_rating + role_bonus, max_rating), max_rating)
            ranges['communication'] = (min(min_rating + role_bonus, max_rating), max_rating)
        
        # Generate stats within adjusted ranges
        for stat, (min_val, max_val) in ranges.items():
            # Ensure min_val doesn't exceed max_val
            min_val = min(min_val, max_val)
            stats[stat] = random.randint(min_val, max_val)
        
        return stats
    
    def _generate_agent_proficiencies(self, primary_role: str, role_rating: int) -> Dict[str, int]:
        """Generate agent-specific proficiencies based on player's role."""
        if primary_role not in self.AGENT_ROLES:
            raise ValueError(f"Invalid role: {primary_role}. Must be one of {list(self.AGENT_ROLES.keys())}")
        
        proficiencies = {}
        
        # Primary role agents get highest proficiencies
        for agent in self.AGENT_ROLES[primary_role]:
            proficiencies[agent] = max(70, min(100, role_rating + random.randint(-10, 10)))
        
        # Other agents get lower proficiencies
        for role, agents in self.AGENT_ROLES.items():
            if role != primary_role:
                for agent in agents:
                    proficiencies[agent] = random.randint(40, 70)
        
        return proficiencies
    
    def _calculate_salary(self, stats: Dict[str, int], age: int) -> int:
        """Calculate player salary based on stats and experience."""
        if age < self.MIN_AGE or age > self.MAX_AGE:
            raise ValueError(f"Age must be between {self.MIN_AGE} and {self.MAX_AGE}")
        
        # Calculate average of core stats
        avg_rating = sum(stats.values()) / len(stats)
        
        # Base multiplier based on rating (exponential scaling)
        rating_multiplier = max(0.5, (avg_rating / 70.0) ** 2.5)
        
        # Experience multiplier (more exponential scaling)
        exp_multiplier = min(3.0, ((age - self.MIN_AGE) / 5.0 + 1.0) ** 1.5)
        
        # Calculate final salary with some randomness
        base = self.BASE_SALARY * rating_multiplier * exp_multiplier
        variation = random.uniform(0.8, 1.2)
        
        return max(int(self.BASE_SALARY * 0.5), int(base * variation))
    
    def _initialize_career_stats(self, player: Player):
        """Initialize career statistics based on matches played."""
        avg_rounds_per_match = 18
        rounds_played = player.matches_played * avg_rounds_per_match
        player.rounds_played = rounds_played
        
        # Calculate average stats per round based on player rating
        avg_rating = (player.aim + player.game_sense + player.utility_usage) / 3
        base_kpr = 0.7 * (avg_rating / 75.0)  # Kills per round
        
        # Calculate total stats
        total_kills = int(rounds_played * base_kpr)
        total_deaths = int(total_kills * random.uniform(0.8, 1.2))  # KD ratio between 0.8 and 1.2
        total_assists = int(total_kills * random.uniform(0.4, 0.8))
        
        # First bloods and clutches based on role and stats
        first_blood_rate = 0.15 if player.role == 'Duelist' else 0.08
        clutch_rate = 0.05 * (player.clutch / 75.0)
        
        player.kills = total_kills
        player.deaths = total_deaths
        player.assists = total_assists
        player.first_bloods = int(total_kills * first_blood_rate)
        player.clutches_won = int(rounds_played * clutch_rate) 