"""
Test data generator utility for the Valorant simulation.
Generates sample players and teams for testing the simulation.
"""

import random
import uuid
from typing import List, Dict, Any, Tuple

from app.simulation.player import Player
from app.simulation.team import Team

class TestDataGenerator:
    """Generates test data for simulation testing."""
    
    # Sample team names and regions
    TEAM_NAMES = [
        "Cloud9", "Sentinels", "100 Thieves", "Team Liquid", "FNATIC",
        "G2 Esports", "Vision Strikers", "FunPlus Phoenix", "Crazy Raccoon",
        "NUTURN Gaming", "KRÜ Esports", "Team Heretics", "Giants Gaming",
        "Acend", "DAMWON Gaming", "Gen.G", "T1", "TSM", "NRG", "XSET"
    ]
    
    PLAYER_FIRST_NAMES = [
        "Tyson", "Shahzeb", "Spencer", "Jaccob", "Anthony", "Michael", "Adil", 
        "Pujan", "Oscar", "Nikita", "Jake", "Hunter", "Jared", "Ryan", "Peter",
        "Nicholas", "Jordan", "Kevin", "Justin", "Quan", "Jung", "Hyun", "Min",
        "Byung", "Sang", "Joon", "Tenz", "Shaz", "Hiko", "Skadoodle", "Subroza"
    ]
    
    PLAYER_LAST_NAMES = [
        "Ngo", "Khan", "Martin", "Whipple", "Malaspina", "Grzesiek", "Benrlitom",
        "Mehta", "Canales", "Fedorov", "Ablaev", "Mims", "Kim", "Ha", "Park", 
        "Cheon", "Oh", "Yang", "Jeong", "Im", "Rothman", "Coby", "Wallace",
        "Montgomery", "Zhang", "Wang", "Li", "Singh", "Martinez", "Johnson"
    ]
    
    REGIONS = {
        "NA": ["United States", "Canada", "Mexico"],
        "EU": ["United Kingdom", "France", "Germany", "Spain", "Sweden", "Denmark", "Finland", "Poland"],
        "APAC": ["South Korea", "Japan", "China", "Singapore", "Thailand", "Philippines", "Indonesia"],
        "SA": ["Brazil", "Argentina", "Chile", "Colombia"],
        "OCE": ["Australia", "New Zealand"]
    }
    
    ROLES = {
        "duelist": ["Jett", "Reyna", "Raze", "Phoenix", "Neon", "Yoru", "ISO"], 
        "initiator": ["Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko"],
        "controller": ["Brimstone", "Omen", "Viper", "Astra", "Harbor", "Clove"],
        "sentinel": ["Killjoy", "Cypher", "Sage", "Chamber", "Deadlock"]
    }
    
    @classmethod
    def generate_test_player(cls, role: str = None, region: str = None, rating: float = None) -> Player:
        """
        Generate a test player with optional constraints.
        
        Args:
            role: Optional role to assign
            region: Optional region to assign
            rating: Optional rating to assign
            
        Returns:
            Player instance
        """
        # Generate random attributes if not specified
        if role is None:
            role = random.choice(list(cls.ROLES.keys()))
            
        if region is None:
            region_key = random.choice(list(cls.REGIONS.keys()))
            region = region_key
            country = random.choice(cls.REGIONS[region_key])
        else:
            country = random.choice(cls.REGIONS.get(region, ["Unknown"]))
            
        if rating is None:
            rating = random.uniform(60.0, 95.0)
            
        # Generate name
        first_name = random.choice(cls.PLAYER_FIRST_NAMES)
        last_name = random.choice(cls.PLAYER_LAST_NAMES)
        
        # Generate core stats with role-based biases
        core_stats = cls._generate_core_stats(role)
        
        # Generate agent proficiencies
        agent_prof = cls._generate_agent_proficiencies(role)
        
        # Generate role proficiencies with primary role having highest value
        role_prof = {}
        for r in cls.ROLES.keys():
            if r == role:
                role_prof[r] = random.uniform(85.0, 100.0)  # Primary role
            else:
                role_prof[r] = random.uniform(40.0, 80.0)   # Secondary roles
        
        # Create player
        player = Player(
            id=str(uuid.uuid4()),
            firstName=first_name,
            lastName=last_name,
            age=random.randint(17, 29),
            nationality=country,
            region=region,
            rating=rating,
            primaryRole=role,
            roleProficiencies=role_prof,
            agentProficiencies=agent_prof,
            coreStats=core_stats,
            salary=random.randint(50000, 300000),
            contract={
                "yearSigned": 2023,
                "length": random.randint(1, 3),
                "value": random.randint(100000, 900000),
                "bonuses": {}
            },
            careerStats={
                "matches": random.randint(50, 500),
                "wins": random.randint(20, 300),
                "kills": random.randint(500, 10000),
                "deaths": random.randint(400, 8000),
                "assists": random.randint(300, 7000),
                "acs": random.uniform(200.0, 280.0),
                "kd": random.uniform(0.8, 1.8),
                "kast": random.uniform(60.0, 85.0),
                "adr": random.uniform(130.0, 180.0),
                "clutches": random.randint(10, 200),
                "firstBloods": random.randint(50, 1000),
                "plants": random.randint(20, 500) if role in ["duelist", "controller"] else random.randint(5, 100),
                "defuses": random.randint(20, 500) if role == "sentinel" else random.randint(5, 100)
            }
        )
        
        return player
    
    @classmethod
    def generate_test_team(cls, region: str = None, rating: float = None) -> Tuple[Team, List[Player]]:
        """
        Generate a test team with a roster of 5 players.
        
        Args:
            region: Optional region to assign
            rating: Optional team rating to assign
            
        Returns:
            Tuple of (Team, List[Player])
        """
        # Generate random attributes if not specified
        if region is None:
            region = random.choice(list(cls.REGIONS.keys()))
            
        if rating is None:
            rating = random.uniform(70.0, 90.0)
            
        # Generate team name
        name = random.choice(cls.TEAM_NAMES)
        
        # Generate players for standard roles
        roles = ["duelist", "duelist", "initiator", "controller", "sentinel"]
        random.shuffle(roles)  # Mix up the roles a bit
        
        players = []
        for role in roles:
            # Generate player with matching region and slight rating variation
            player_rating = max(60, min(95, rating + random.uniform(-10, 10)))
            player = cls.generate_test_player(role=role, region=region, rating=player_rating)
            players.append(player)
        
        # Create team
        team = Team(
            id=str(uuid.uuid4()),
            name=name,
            region=region,
            rating=rating,
            chemistry=random.uniform(60.0, 95.0),
            budget=random.randint(1000000, 5000000),
            current_balance=random.randint(200000, 1000000),
            training_focus={
                "aim": random.uniform(0.1, 0.3),
                "utility": random.uniform(0.1, 0.3),
                "strategy": random.uniform(0.1, 0.3),
                "teamplay": random.uniform(0.1, 0.3)
            },
            win_count=random.randint(10, 100),
            loss_count=random.randint(5, 70),
            roster=[p.id for p in players],
            strategy_preferences={
                "aggression": random.uniform(0.3, 0.7),
                "economy_focus": random.uniform(0.3, 0.7),
                "site_control": random.uniform(0.3, 0.7),
                "rotation_speed": random.uniform(0.3, 0.7),
                "operator_usage": random.uniform(0.3, 0.7)
            }
        )
        
        return team, players
    
    @classmethod
    def generate_test_match_data(cls) -> Dict[str, Any]:
        """
        Generate test data for a match simulation including two teams with their players.
        
        Returns:
            Dictionary with two teams and their players
        """
        # Generate two teams from different regions
        regions = list(cls.REGIONS.keys())
        random.shuffle(regions)
        
        team_a, players_a = cls.generate_test_team(region=regions[0])
        team_b, players_b = cls.generate_test_team(region=regions[1])
        
        return {
            "team_a": team_a,
            "team_b": team_b,
            "team_a_players": players_a,
            "team_b_players": players_b
        }
    
    @classmethod
    def _generate_core_stats(cls, role: str) -> Dict[str, float]:
        """
        Generate core stats with biases based on role.
        
        Args:
            role: Player role
            
        Returns:
            Dictionary of core stats
        """
        # Base ranges for all stats
        base_ranges = {
            "aim": (70.0, 95.0),
            "gamesense": (70.0, 95.0),
            "leadership": (50.0, 90.0),
            "communication": (60.0, 95.0),
            "utility": (70.0, 95.0),
            "clutch": (60.0, 95.0),
            "consistency": (60.0, 90.0),
            "flexibility": (60.0, 90.0),
            "entry": (60.0, 90.0),
            "support": (60.0, 90.0),
        }
        
        # Role-specific bias adjustments (added to the base min/max)
        role_biases = {
            "duelist": {
                "aim": (5, 5),
                "entry": (10, 5),
                "flexibility": (-5, 0),
                "support": (-10, -5),
                "clutch": (5, 5)
            },
            "initiator": {
                "gamesense": (5, 5),
                "utility": (5, 5),
                "communication": (5, 5),
                "entry": (0, 5),
                "support": (5, 5)
            },
            "controller": {
                "utility": (10, 5),
                "gamesense": (5, 5),
                "leadership": (5, 5),
                "support": (10, 5),
                "aim": (-5, 0)
            },
            "sentinel": {
                "utility": (5, 5),
                "clutch": (5, 5),
                "gamesense": (5, 5),
                "entry": (-10, -5),
                "consistency": (5, 5)
            }
        }
        
        # Apply role biases to base ranges
        biased_ranges = {}
        for stat, (base_min, base_max) in base_ranges.items():
            bias_min, bias_max = role_biases.get(role, {}).get(stat, (0, 0))
            biased_min = max(0, min(100, base_min + bias_min))
            biased_max = max(0, min(100, base_max + bias_max))
            biased_ranges[stat] = (biased_min, biased_max)
        
        # Generate stats using the biased ranges
        core_stats = {}
        for stat, (min_val, max_val) in biased_ranges.items():
            core_stats[stat] = round(random.uniform(min_val, max_val), 1)
        
        return core_stats
    
    @classmethod
    def _generate_agent_proficiencies(cls, primary_role: str) -> Dict[str, float]:
        """
        Generate agent proficiencies with role bias.
        
        Args:
            primary_role: Player's primary role
            
        Returns:
            Dictionary of agent proficiencies
        """
        proficiencies = {}
        
        # Generate proficiencies for all agents
        for role, agents in cls.ROLES.items():
            for agent in agents:
                if role == primary_role:
                    # Higher proficiency for agents in primary role
                    proficiencies[agent] = round(random.uniform(75.0, 95.0), 1)
                else:
                    # Lower proficiency for other agents
                    proficiencies[agent] = round(random.uniform(50.0, 80.0), 1)
        
        # Select 1-3 agents as specialties across all roles
        num_specialties = random.randint(1, 3)
        all_agents = [agent for agents in cls.ROLES.values() for agent in agents]
        specialty_agents = random.sample(all_agents, num_specialties)
        
        for agent in specialty_agents:
            proficiencies[agent] = round(min(100.0, proficiencies[agent] + random.uniform(5.0, 15.0)), 1)
        
        return proficiencies 