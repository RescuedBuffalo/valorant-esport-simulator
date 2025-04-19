"""
Unit tests for the PlayerGenerator class.
"""
import unittest
from app.simulation.player_generator import PlayerGenerator

class TestPlayerGenerator(unittest.TestCase):
    def setUp(self):
        """Set up a PlayerGenerator instance for testing."""
        self.generator = PlayerGenerator()

    def test_generate_player_basic(self):
        """Test basic player generation with default parameters."""
        player = self.generator.generate_player()
        
        # Test basic attributes
        self.assertIsNotNone(player['first_name'])
        self.assertIsNotNone(player['last_name'])
        self.assertIsNotNone(player['nationality'])
        self.assertGreaterEqual(player['age'], PlayerGenerator.MIN_AGE)
        self.assertLessEqual(player['age'], PlayerGenerator.MAX_AGE)
        self.assertGreater(player['salary'], PlayerGenerator.BASE_SALARY * 0.5)
        
        # Test role assignment
        self.assertIn(player['primary_role'], PlayerGenerator.ROLES.keys())
        
        # Test proficiencies
        self.assertEqual(
            set(player['role_proficiencies'].keys()),
            set(PlayerGenerator.ROLES.keys())
        )
        self.assertGreaterEqual(player['role_proficiencies'][player['primary_role']], 80)
        
        # Test agent proficiencies
        for agent in PlayerGenerator.ROLES[player['primary_role']]:
            self.assertIn(agent, player['agent_proficiencies'])
            self.assertGreaterEqual(player['agent_proficiencies'][agent], 70)

    def test_generate_player_with_constraints(self):
        """Test player generation with specific constraints."""
        player = self.generator.generate_player(
            region='NA',
            role='Duelist',
            min_rating=80,
            max_rating=90
        )
        
        # Test constraints are met
        self.assertIn(player['nationality'], PlayerGenerator.REGIONS['NA'])
        self.assertEqual(player['primary_role'], 'Duelist')
        
        # Test rating constraints
        core_stats = player['core_stats']
        for stat in core_stats.values():
            self.assertGreaterEqual(stat, 80)
            self.assertLessEqual(stat, 100)  # Account for role bonus

    def test_generate_player_edge_cases(self):
        """Test player generation with edge cases."""
        # Test minimum possible ratings
        min_player = self.generator.generate_player(min_rating=0, max_rating=1)
        for stat in min_player['core_stats'].values():
            self.assertGreaterEqual(stat, 0)
            self.assertLessEqual(stat, 1.1)  # Account for role bonus
        
        # Test maximum possible ratings
        max_player = self.generator.generate_player(min_rating=99, max_rating=100)
        for stat in max_player['core_stats'].values():
            self.assertGreaterEqual(stat, 99)
            self.assertLessEqual(stat, 100)
        
        # Test invalid region
        with self.assertRaises(ValueError):
            self.generator.generate_player(region='INVALID')
        
        # Test invalid role
        with self.assertRaises(ValueError):
            self.generator.generate_player(role='INVALID')

    def test_generate_team_roster(self):
        """Test team roster generation."""
        roster_size = 5
        roster = self.generator.generate_team_roster(
            region='EU',
            size=roster_size,
            min_rating=70,
            max_rating=90
        )
        
        # Test roster size
        self.assertEqual(len(roster), roster_size)
        
        # Test all players are from EU
        for player in roster:
            self.assertIn(player['nationality'], PlayerGenerator.REGIONS['EU'])
        
        # Test role distribution
        roles = [player['primary_role'] for player in roster]
        core_roles = ['Controller', 'Duelist', 'Initiator', 'Sentinel']
        # For a 5-player roster, at least 4 core roles should be present
        core_roles_present = sum(1 for role in core_roles if role in roles)
        self.assertGreaterEqual(core_roles_present, min(len(core_roles), roster_size))
        
        # Test no duplicate players
        names = [(player['first_name'], player['last_name']) for player in roster]
        self.assertEqual(len(names), len(set(names)))

    def test_generate_team_roster_edge_cases(self):
        """Test team roster generation with edge cases."""
        # Test minimum roster size
        min_roster = self.generator.generate_team_roster(size=1)
        self.assertEqual(len(min_roster), 1)
        
        # Test maximum roster size
        max_roster = self.generator.generate_team_roster(size=10)
        self.assertEqual(len(max_roster), 10)
        
        # Test invalid region
        with self.assertRaises(ValueError):
            self.generator.generate_team_roster(region='INVALID')
        
        # Test invalid roster size
        with self.assertRaises(ValueError):
            self.generator.generate_team_roster(size=0)
        with self.assertRaises(ValueError):
            self.generator.generate_team_roster(size=11)

    def test_core_stats_generation(self):
        """Test core stats generation with role-specific biases."""
        stats = self.generator._generate_core_stats(
            'Duelist',
            min_rating=70,
            max_rating=90
        )
        
        # Test all stats are present
        required_stats = {'aim', 'game_sense', 'movement', 'utility_usage', 'communication', 'clutch'}
        self.assertEqual(set(stats.keys()), required_stats)
        
        # Test value ranges
        for stat in stats.values():
            self.assertGreaterEqual(stat, 70)
            self.assertLessEqual(stat, 99)  # Account for role bonus

    def test_role_proficiencies(self):
        """Test role proficiency generation."""
        proficiencies = self.generator._generate_role_proficiencies('Duelist')
        
        # Test all roles are present
        self.assertEqual(
            set(proficiencies.keys()),
            set(PlayerGenerator.ROLES.keys())
        )
        
        # Test primary role has higher proficiency
        self.assertGreaterEqual(proficiencies['Duelist'], 80)
        for role, value in proficiencies.items():
            if role != 'Duelist':
                self.assertGreaterEqual(value, 50)
                self.assertLessEqual(value, 85)

    def test_agent_proficiencies(self):
        """Test agent proficiency generation."""
        proficiencies = self.generator._generate_agent_proficiencies('Duelist')
        
        # Test all agents are present
        all_agents = [agent for agents in PlayerGenerator.ROLES.values() for agent in agents]
        self.assertEqual(set(proficiencies.keys()), set(all_agents))
        
        # Test primary role agents have higher proficiency
        for agent in PlayerGenerator.ROLES['Duelist']:
            self.assertGreaterEqual(proficiencies[agent], 80)
            self.assertLessEqual(proficiencies[agent], 100)
        
        # Test other role agents have lower proficiency
        for role, agents in PlayerGenerator.ROLES.items():
            if role != 'Duelist':
                for agent in agents:
                    self.assertGreaterEqual(proficiencies[agent], 50)
                    self.assertLessEqual(proficiencies[agent], 85)

    def test_career_stats(self):
        """Test career statistics generation."""
        stats = self.generator._init_career_stats()
        
        # Test all required stats are present
        required_stats = {
            'matches_played', 'kills', 'deaths', 'assists',
            'first_bloods', 'clutches', 'win_rate', 'kd_ratio',
            'kda_ratio', 'first_blood_rate', 'clutch_rate'
        }
        self.assertEqual(set(stats.keys()), required_stats)
        
        # Test value ranges
        self.assertGreaterEqual(stats['matches_played'], 50)
        self.assertLessEqual(stats['matches_played'], 500)
        
        self.assertGreater(stats['kills'], 0)
        self.assertGreater(stats['deaths'], 0)
        self.assertGreater(stats['assists'], 0)
        
        self.assertGreaterEqual(stats['win_rate'], 0.4)
        self.assertLessEqual(stats['win_rate'], 0.6)
        
        self.assertGreaterEqual(stats['kd_ratio'], 0)
        self.assertGreaterEqual(stats['kda_ratio'], 0)
        
        self.assertGreaterEqual(stats['first_blood_rate'], 0)
        self.assertLessEqual(stats['first_blood_rate'], 1)
        
        self.assertGreaterEqual(stats['clutch_rate'], 0)
        self.assertLessEqual(stats['clutch_rate'], 1)

    def test_salary_calculation(self):
        """Test salary calculation based on stats and age."""
        core_stats = {
            'aim': 90,
            'game_sense': 85,
            'movement': 88,
            'utility_usage': 82,
            'communication': 80,
            'clutch': 85
        }
        
        # Test peak age salary
        peak_salary = self.generator._calculate_salary(core_stats, 25)
        self.assertGreater(peak_salary, PlayerGenerator.BASE_SALARY)
        
        # Test young player salary
        young_salary = self.generator._calculate_salary(core_stats, 18)
        self.assertLess(young_salary, peak_salary)
        
        # Test veteran salary
        veteran_salary = self.generator._calculate_salary(core_stats, 31)
        self.assertLess(veteran_salary, peak_salary)

    def test_validation(self):
        """Test player validation."""
        player = self.generator.generate_player()
        
        # Test validation passes for valid player
        try:
            self.generator._validate_player(player)
        except ValueError:
            self.fail("Validation failed for valid player")
        
        # Test validation fails for invalid age
        invalid_player = player.copy()
        invalid_player['age'] = 15
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)
        
        # Test validation fails for invalid region
        invalid_player = player.copy()
        invalid_player['region'] = 'INVALID'
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)
        
        # Test validation fails for invalid role
        invalid_player = player.copy()
        invalid_player['primary_role'] = 'INVALID'
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)
        
        # Test validation fails for invalid core stats
        invalid_player = player.copy()
        invalid_player['core_stats']['aim'] = 101
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)

if __name__ == '__main__':
    unittest.main() 