"""
Player generation system for Valorant simulation.
"""
from typing import Dict, List, Optional, Tuple, Union
import random
import names
from .player_validation import PlayerValidation, ValidationError

class PlayerGenerator:
    """Generates realistic Valorant professional players."""

    # Constants for player generation
    MIN_AGE = 16
    MAX_AGE = 30
    BASE_SALARY = 50000

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

    def generate_player(
        self,
        region: Optional[str] = None,
        role: Optional[str] = None,
        min_rating: float = 60.0,
        max_rating: float = 95.0
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

        if errors:
            raise ValueError(f"Invalid parameters: {', '.join(e.message for e in errors)}")

        # Generate player attributes
        selected_region = region or random.choice(list(self.REGIONS.keys()))
        selected_role = role or random.choice(list(self.ROLES.keys()))
        
        age = random.randint(self.MIN_AGE, self.MAX_AGE)
        nationality = random.choice(self.REGIONS[selected_region])
        
        # Generate name (currently male-focused due to pro scene demographics)
        first_name = names.get_first_name(gender='male')
        last_name = names.get_last_name()
        
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
            'first_name': first_name,
            'last_name': last_name,
            'age': age,
            'nationality': nationality,
            'region': selected_region,
            'primary_role': selected_role,
            'core_stats': core_stats,
            'role_proficiencies': role_proficiencies,
            'agent_proficiencies': agent_proficiencies,
            'salary': salary,
            'career_stats': career_stats
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
            'game_sense': random.uniform(min_rating, max_rating),
            'movement': random.uniform(min_rating, max_rating),
            'utility_usage': random.uniform(min_rating, max_rating),
            'communication': random.uniform(min_rating, max_rating),
            'clutch': random.uniform(min_rating, max_rating)
        }
        
        # Apply role-specific biases
        if role == 'Duelist':
            base_stats['aim'] = min(100, base_stats['aim'] * 1.1)
            base_stats['movement'] = min(100, base_stats['movement'] * 1.1)
        elif role == 'Controller':
            base_stats['utility_usage'] = min(100, base_stats['utility_usage'] * 1.1)
            base_stats['game_sense'] = min(100, base_stats['game_sense'] * 1.1)
        elif role == 'Sentinel':
            base_stats['game_sense'] = min(100, base_stats['game_sense'] * 1.1)
            base_stats['clutch'] = min(100, base_stats['clutch'] * 1.1)
        elif role == 'Initiator':
            base_stats['utility_usage'] = min(100, base_stats['utility_usage'] * 1.1)
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
        rounds_per_match = random.uniform(16, 24)  # Average rounds per match
        total_rounds = int(matches_played * rounds_per_match)
        
        # Calculate kills, deaths, assists based on rounds
        kills_per_round = random.uniform(0.7, 1.2)  # Average kills per round
        deaths_per_round = random.uniform(0.6, 1.0)  # Average deaths per round
        assists_per_round = random.uniform(0.3, 0.7)  # Average assists per round
        
        kills = int(total_rounds * kills_per_round)
        deaths = int(total_rounds * deaths_per_round)
        assists = int(total_rounds * assists_per_round)
        
        # First bloods can't exceed matches played
        first_blood_rate = random.uniform(0.15, 0.35)  # 15-35% chance of getting first blood
        first_bloods = int(matches_played * first_blood_rate)
        
        # Clutches are based on rounds but should be relatively rare
        clutch_rate = random.uniform(0.02, 0.08)  # 2-8% of rounds are clutched
        clutches = int(total_rounds * clutch_rate)
        
        stats = {
            'matches_played': matches_played,
            'kills': kills,
            'deaths': deaths,
            'assists': assists,
            'first_bloods': first_bloods,
            'clutches': clutches,
            'win_rate': random.uniform(0.4, 0.6),
            'kd_ratio': kills / max(deaths, 1),
            'kda_ratio': (kills + assists) / max(deaths, 1),
            'first_blood_rate': first_bloods / matches_played,  # Now guaranteed to be between 0 and 1
            'clutch_rate': clutches / total_rounds  # Now guaranteed to be between 0 and 1
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
        role_error = self.validation.validate_role(player['primary_role'], self.ROLES)
        if role_error:
            errors.append(role_error)
        
        # Validate core stats
        core_stat_errors = self.validation.validate_core_stats(player['core_stats'])
        errors.extend(core_stat_errors)
        
        # Validate role proficiencies
        role_prof_errors = self.validation.validate_proficiencies(
            player['role_proficiencies'],
            list(self.ROLES.keys())
        )
        errors.extend(role_prof_errors)
        
        # Validate agent proficiencies
        all_agents = [agent for agents in self.ROLES.values() for agent in agents]
        agent_prof_errors = self.validation.validate_proficiencies(
            player['agent_proficiencies'],
            all_agents
        )
        errors.extend(agent_prof_errors)
        
        # Validate career stats
        career_stat_errors = self.validation.validate_career_stats(player['career_stats'])
        errors.extend(career_stat_errors)
        
        if errors:
            raise ValueError(f"Invalid player object: {', '.join(e.message for e in errors)}") 