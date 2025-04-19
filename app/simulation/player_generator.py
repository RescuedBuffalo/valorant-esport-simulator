"""
Player generation system for Valorant simulation.
"""
from typing import Dict, List, Optional, Tuple, Union
import random
import names
import uuid
from .player_validation import PlayerValidation, ValidationError

class PlayerGenerator:
    """Generates realistic Valorant professional players."""

    # Constants for player generation
    MIN_AGE = 16
    MAX_AGE = 30
    BASE_SALARY = 50000

    # Gamer tag components for generating realistic nicknames
    GAMER_TAG_PREFIXES = ['', 'The', 'Pro', 'Team', 'Mr', 'Young', 'Old', 'Pure']
    GAMER_TAG_WORDS = [
        'Ace', 'Clutch', 'Aim', 'Shot', 'Hawk', 'Eagle', 'Wolf', 'Tiger',
        'Ninja', 'Shadow', 'Storm', 'Fire', 'Ice', 'Flash', 'Quick', 'Swift',
        'Sniper', 'Guard', 'Shield', 'Blade', 'Knight', 'King', 'Legend',
        'Phoenix', 'Dragon', 'Viper', 'Sage', 'Hunter', 'Scout', 'Warrior'
    ]
    GAMER_TAG_SUFFIXES = ['', 'X', 'TV', 'Pro', 'TTV', 'YT', 'Gaming']

    # Region definitions with associated countries
    REGIONS = {
        'NA': ['USA', 'Canada', 'Mexico'],
        'EU': ['France', 'Germany', 'UK', 'Spain', 'Sweden', 'Denmark', 'Poland'],
        'APAC': ['Japan', 'Korea', 'China', 'Thailand', 'Indonesia', 'Philippines'],
        'BR': ['Brazil'],
        'LATAM': ['Argentina', 'Chile', 'Colombia', 'Peru']
    }

    # Role definitions with associated agents
    ROLES = {
        'Controller': ['Omen', 'Brimstone', 'Viper', 'Astra', 'Harbor'],
        'Duelist': ['Jett', 'Phoenix', 'Raze', 'Reyna', 'Yoru', 'Neon'],
        'Initiator': ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko'],
        'Sentinel': ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock']
    }

    def __init__(self):
        """Initialize the player generator."""
        self.validation = PlayerValidation()

    def _generate_gamer_tag(self) -> str:
        """Generate a realistic gamer tag."""
        # 30% chance to use a prefix
        prefix = random.choice(self.GAMER_TAG_PREFIXES) if random.random() < 0.3 else ''
        
        # Main part of the tag
        if random.random() < 0.3:  # 30% chance for two words
            main = random.choice(self.GAMER_TAG_WORDS) + random.choice(self.GAMER_TAG_WORDS)
        else:
            main = random.choice(self.GAMER_TAG_WORDS)
            
        # 40% chance to add a suffix
        suffix = random.choice(self.GAMER_TAG_SUFFIXES) if random.random() < 0.4 else ''
        
        # 20% chance to add a number
        if random.random() < 0.2:
            suffix = str(random.randint(0, 99)) + suffix
            
        tag_parts = [p for p in [prefix, main, suffix] if p]
        return ''.join(tag_parts)

    def generate_player(
        self,
        region: Optional[str] = None,
        role: Optional[str] = None,
        min_rating: float = 60.0,
        max_rating: float = 95.0,
        max_age: Optional[int] = None
    ) -> Dict[str, Union[str, int, float, Dict]]:
        """Generate a single player with specified constraints."""
        # Validate inputs
        errors = []
        if region:
            region_error = self.validation.validate_region(region, self.REGIONS)
            if region_error:
                errors.append(region_error)
        if role:
            role_error = self.validation.validate_role(role, self.ROLES)
            if role_error:
                errors.append(role_error)
        
        rating_error = self.validation.validate_rating_range(min_rating, max_rating)
        if rating_error:
            errors.append(rating_error)

        if max_age and (max_age < self.MIN_AGE or max_age > self.MAX_AGE):
            errors.append(ValidationError("age", f"Max age must be between {self.MIN_AGE} and {self.MAX_AGE}"))

        if errors:
            raise ValueError(f"Invalid parameters: {', '.join(e.message for e in errors)}")

        # Generate player attributes
        selected_region = region or random.choice(list(self.REGIONS.keys()))
        selected_role = role or random.choice(list(self.ROLES.keys()))
        
        age = random.randint(self.MIN_AGE, max_age or self.MAX_AGE)
        nationality = random.choice(self.REGIONS[selected_region])
        
        # Generate name (currently male-focused due to pro scene demographics)
        first_name = names.get_first_name(gender='male')
        last_name = names.get_last_name()
        gamer_tag = self._generate_gamer_tag()
        
        # Generate core stats with role-specific biases
        core_stats = self._generate_core_stats(selected_role, min_rating, max_rating)
        
        # Generate role and agent proficiencies
        role_proficiencies = self._generate_role_proficiencies(selected_role)
        agent_proficiencies = self._generate_agent_proficiencies(selected_role)
        
        # Calculate salary based on stats and age
        salary = self._calculate_salary(core_stats, age)
        
        # Initialize career statistics
        career_stats = self._init_career_stats()
        
        player = {
            'id': str(uuid.uuid4()),
            'firstName': first_name,
            'lastName': last_name,
            'gamerTag': gamer_tag,
            'age': age,
            'nationality': nationality,
            'region': selected_region,
            'primaryRole': selected_role,
            'coreStats': core_stats,
            'roleProficiencies': role_proficiencies,
            'agentProficiencies': agent_proficiencies,
            'salary': salary,
            'careerStats': career_stats
        }

        # Validate the complete player object
        self._validate_player(player)
        
        return player

    def generate_team_roster(
        self,
        region: Optional[str] = None,
        size: int = 5,
        min_rating: float = 70.0,
        max_rating: float = 95.0
    ) -> List[Dict]:
        """Generate a balanced team roster."""
        # Validate inputs
        errors = []
        if region:
            region_error = self.validation.validate_region(region, self.REGIONS)
            if region_error:
                errors.append(region_error)
        
        size_error = self.validation.validate_roster_size(size)
        if size_error:
            errors.append(size_error)
        
        rating_error = self.validation.validate_rating_range(min_rating, max_rating)
        if rating_error:
            errors.append(rating_error)

        if errors:
            raise ValueError(f"Invalid parameters: {', '.join(e.message for e in errors)}")

        # Ensure core roles are covered first
        core_roles = ['Controller', 'Duelist', 'Initiator', 'Sentinel']
        roster = []
        
        # Generate players for core roles
        for role in core_roles[:min(size, len(core_roles))]:
            player = self.generate_player(
                region=region,
                role=role,
                min_rating=min_rating,
                max_rating=max_rating
            )
            roster.append(player)
        
        # Fill remaining slots with flexible roles
        while len(roster) < size:
            player = self.generate_player(
                region=region,
                min_rating=min_rating,
                max_rating=max_rating
            )
            roster.append(player)
        
        return roster

    def _generate_core_stats(
        self,
        role: str,
        min_rating: float,
        max_rating: float
    ) -> Dict[str, float]:
        """Generate core stats with role-specific biases."""
        base_stats = {
            'aim': random.uniform(min_rating, max_rating),
            'gameSense': random.uniform(min_rating, max_rating),
            'movement': random.uniform(min_rating, max_rating),
            'utilityUsage': random.uniform(min_rating, max_rating),
            'communication': random.uniform(min_rating, max_rating),
            'clutch': random.uniform(min_rating, max_rating)
        }
        
        # Apply role-specific biases
        if role == 'Duelist':
            base_stats['aim'] = min(100, base_stats['aim'] * 1.1)
            base_stats['movement'] = min(100, base_stats['movement'] * 1.1)
        elif role == 'Controller':
            base_stats['utilityUsage'] = min(100, base_stats['utilityUsage'] * 1.1)
            base_stats['gameSense'] = min(100, base_stats['gameSense'] * 1.1)
        elif role == 'Sentinel':
            base_stats['gameSense'] = min(100, base_stats['gameSense'] * 1.1)
            base_stats['clutch'] = min(100, base_stats['clutch'] * 1.1)
        elif role == 'Initiator':
            base_stats['utilityUsage'] = min(100, base_stats['utilityUsage'] * 1.1)
            base_stats['communication'] = min(100, base_stats['communication'] * 1.1)
        
        # Validate core stats
        errors = self.validation.validate_core_stats(base_stats)
        if errors:
            raise ValueError(f"Invalid core stats: {', '.join(e.message for e in errors)}")
        
        return base_stats

    def _generate_role_proficiencies(self, primary_role: str) -> Dict[str, float]:
        """Generate role proficiencies with primary role bias."""
        proficiencies = {}
        for role in self.ROLES:
            if role == primary_role:
                proficiencies[role] = random.uniform(80, 100)
            else:
                proficiencies[role] = random.uniform(50, 85)
        
        # Validate role proficiencies
        errors = self.validation.validate_proficiencies(proficiencies, list(self.ROLES.keys()))
        if errors:
            raise ValueError(f"Invalid role proficiencies: {', '.join(e.message for e in errors)}")
        
        return proficiencies

    def _generate_agent_proficiencies(self, primary_role: str) -> Dict[str, float]:
        """Generate agent proficiencies with role-specific biases."""
        proficiencies = {}
        primary_agents = self.ROLES[primary_role]
        
        # Generate proficiencies for all agents
        for role, agents in self.ROLES.items():
            for agent in agents:
                if agent in primary_agents:
                    proficiencies[agent] = random.uniform(80, 100)
                else:
                    proficiencies[agent] = random.uniform(50, 85)
        
        # Validate agent proficiencies
        all_agents = [agent for agents in self.ROLES.values() for agent in agents]
        errors = self.validation.validate_proficiencies(proficiencies, all_agents)
        if errors:
            raise ValueError(f"Invalid agent proficiencies: {', '.join(e.message for e in errors)}")
        
        return proficiencies

    def _calculate_salary(self, core_stats: Dict[str, float], age: int) -> float:
        """Calculate player salary based on stats and age."""
        # Base calculation from core stats
        stat_multiplier = sum(core_stats.values()) / (len(core_stats) * 100)
        
        # Age factor (peak at 23-27)
        age_factor = 1.0
        if 23 <= age <= 27:
            age_factor = 1.2
        elif age < 20:
            age_factor = 0.8
        elif age > 30:
            age_factor = 0.7
        
        return round(self.BASE_SALARY * stat_multiplier * age_factor, 2)

    def _init_career_stats(self) -> Dict[str, Union[int, float]]:
        """Initialize career statistics."""
        matches_played = random.randint(50, 500)
        
        # Calculate kills, deaths, assists
        kills = int(matches_played * random.uniform(15, 25))
        deaths = int(matches_played * random.uniform(12, 20))
        assists = int(matches_played * random.uniform(5, 10))
        
        # Calculate first bloods (ensure rate is between 0 and 1)
        max_possible_first_bloods = matches_played  # Can't have more first bloods than matches
        first_bloods = min(
            int(matches_played * random.uniform(0.1, 0.3)),  # Target 10-30% of matches
            max_possible_first_bloods
        )
        
        # Calculate clutches (ensure rate is between 0 and 1)
        max_possible_clutches = matches_played  # Can't have more clutches than matches
        clutches = min(
            int(matches_played * random.uniform(0.05, 0.15)),  # Target 5-15% of matches
            max_possible_clutches
        )
        
        stats = {
            'matchesPlayed': matches_played,
            'kills': kills,
            'deaths': deaths,
            'assists': assists,
            'firstBloods': first_bloods,
            'clutches': clutches,
            'winRate': random.uniform(0.4, 0.6),
            'kdRatio': kills / max(deaths, 1),
            'kdaRatio': (kills + assists) / max(deaths, 1),
            'firstBloodRate': first_bloods / matches_played,  # Now guaranteed to be between 0 and 1
            'clutchRate': clutches / matches_played  # Now guaranteed to be between 0 and 1
        }
        
        # Validate career stats
        errors = self.validation.validate_career_stats(stats)
        if errors:
            raise ValueError(f"Invalid career stats: {', '.join(e.message for e in errors)}")
        
        return stats

    def _validate_player(self, player: Dict) -> None:
        """Validate the complete player object."""
        errors = []
        
        # Validate age
        age_error = self.validation.validate_age(player['age'])
        if age_error:
            errors.append(age_error)
        
        # Validate region
        region_error = self.validation.validate_region(player['region'], self.REGIONS)
        if region_error:
            errors.append(region_error)
        
        # Validate role
        role_error = self.validation.validate_role(player['primaryRole'], self.ROLES)
        if role_error:
            errors.append(role_error)
        
        # Validate core stats
        core_stat_errors = self.validation.validate_core_stats(player['coreStats'])
        errors.extend(core_stat_errors)
        
        # Validate role proficiencies
        role_prof_errors = self.validation.validate_proficiencies(
            player['roleProficiencies'],
            list(self.ROLES.keys())
        )
        errors.extend(role_prof_errors)
        
        # Validate agent proficiencies
        all_agents = [agent for agents in self.ROLES.values() for agent in agents]
        agent_prof_errors = self.validation.validate_proficiencies(
            player['agentProficiencies'],
            all_agents
        )
        errors.extend(agent_prof_errors)
        
        # Validate career stats
        career_stat_errors = self.validation.validate_career_stats(player['careerStats'])
        errors.extend(career_stat_errors)
        
        if errors:
            raise ValueError(f"Invalid player object: {', '.join(e.message for e in errors)}") 