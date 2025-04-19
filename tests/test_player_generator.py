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
        self.assertIsNotNone(player['firstName'])
        self.assertIsNotNone(player['lastName'])
        self.assertIsNotNone(player['nationality'])
        self.assertGreaterEqual(player['age'], PlayerGenerator.MIN_AGE)
        self.assertLessEqual(player['age'], PlayerGenerator.MAX_AGE)
        self.assertGreater(player['salary'], PlayerGenerator.BASE_SALARY * 0.5)
        
        # Test role assignment
        self.assertIn(player['primaryRole'], PlayerGenerator.ROLES.keys())
        
        # Test proficiencies
        self.assertEqual(
            set(player['roleProficiencies'].keys()),
            set(PlayerGenerator.ROLES.keys())
        )
        self.assertGreaterEqual(player['roleProficiencies'][player['primaryRole']], 80)
        
        # Test agent proficiencies
        for agent in PlayerGenerator.ROLES[player['primaryRole']]:
            self.assertIn(agent, player['agentProficiencies'])
            self.assertGreaterEqual(player['agentProficiencies'][agent], 70)

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
        self.assertEqual(player['primaryRole'], 'Duelist')
        
        # Test rating constraints
        coreStats = player['coreStats']
        for stat in coreStats.values():
            self.assertGreaterEqual(stat, 80)
            self.assertLessEqual(stat, 100)  # Account for role bonus

    def test_generate_player_edge_cases(self):
        """Test player generation with edge cases."""
        # Test minimum possible ratings
        min_player = self.generator.generate_player(min_rating=0, max_rating=1)
        for stat in min_player['coreStats'].values():
            self.assertGreaterEqual(stat, 0)
            self.assertLessEqual(stat, 1.1)  # Account for role bonus
        
        # Test maximum possible ratings
        max_player = self.generator.generate_player(min_rating=99, max_rating=100)
        for stat in max_player['coreStats'].values():
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
        roles = [player['primaryRole'] for player in roster]
        coreRoles = ['Controller', 'Duelist', 'Initiator', 'Sentinel']
        # For a 5-player roster, at least 4 core roles should be present
        coreRolesPresent = sum(1 for role in coreRoles if role in roles)
        self.assertGreaterEqual(coreRolesPresent, min(len(coreRoles), roster_size))
        
        # Test no duplicate players
        names = [(player['firstName'], player['lastName']) for player in roster]
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
        required_stats = {'aim', 'gameSense', 'movement', 'utilityUsage', 'communication', 'clutch'}
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
        allAgents = [agent for agents in PlayerGenerator.ROLES.values() for agent in agents]
        self.assertEqual(set(proficiencies.keys()), set(allAgents))
        
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
            'matchesPlayed', 'kills', 'deaths', 'assists',
            'firstBloods', 'clutches', 'winRate', 'kdRatio',
            'kdaRatio', 'firstBloodRate', 'clutchRate'
        }
        self.assertEqual(set(stats.keys()), required_stats)
        
        # Test value ranges
        self.assertGreaterEqual(stats['matchesPlayed'], 50)
        self.assertLessEqual(stats['matchesPlayed'], 500)
        
        self.assertGreater(stats['kills'], 0)
        self.assertGreater(stats['deaths'], 0)
        self.assertGreater(stats['assists'], 0)
        
        self.assertGreaterEqual(stats['winRate'], 0.4)
        self.assertLessEqual(stats['winRate'], 0.6)
        
        self.assertGreaterEqual(stats['kdRatio'], 0)
        self.assertGreaterEqual(stats['kdaRatio'], 0)
        
        self.assertGreaterEqual(stats['firstBloodRate'], 0)
        self.assertLessEqual(stats['firstBloodRate'], 1)
        
        self.assertGreaterEqual(stats['clutchRate'], 0)
        self.assertLessEqual(stats['clutchRate'], 1)

    def test_salary_calculation(self):
        """Test salary calculation based on stats and age."""
        coreStats = {
            'aim': 90,
            'gameSense': 85,
            'movement': 88,
            'utilityUsage': 82,
            'communication': 80,
            'clutch': 85
        }
        
        # Test peak age salary
        peakSalary = self.generator._calculate_salary(coreStats, 25)
        self.assertGreater(peakSalary, PlayerGenerator.BASE_SALARY)
        
        # Test young player salary
        youngSalary = self.generator._calculate_salary(coreStats, 18)
        self.assertLess(youngSalary, peakSalary)
        
        # Test veteran salary
        veteranSalary = self.generator._calculate_salary(coreStats, 31)
        self.assertLess(veteranSalary, peakSalary)

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
        invalid_player['primaryRole'] = 'INVALID'
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)
        
        # Test validation fails for invalid core stats
        invalid_player = player.copy()
        invalid_player['coreStats']['aim'] = 101
        with self.assertRaises(ValueError):
            self.generator._validate_player(invalid_player)

if __name__ == '__main__':
    unittest.main() 