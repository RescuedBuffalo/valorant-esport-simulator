"""
Unit tests for the PlayerGenerator class.
"""
import unittest
from app.simulation.player_generator import PlayerGenerator

class TestPlayerGenerator(unittest.TestCase):
    def setUp(self):
        """Set up a PlayerGenerator instance with a fixed seed for reproducibility."""
        self.generator = PlayerGenerator(seed=42)

    def test_generate_player_basic(self):
        """Test basic player generation with default parameters."""
        player = self.generator.generate_player()
        
        # Test basic attributes
        self.assertIsNotNone(player.name)
        self.assertIsNotNone(player.nationality)
        self.assertGreaterEqual(player.age, PlayerGenerator.MIN_AGE)
        self.assertLessEqual(player.age, PlayerGenerator.MAX_AGE)
        self.assertGreater(player.salary, PlayerGenerator.BASE_SALARY)
        
        # Test role assignment
        self.assertIn(player.role, PlayerGenerator.AGENT_ROLES.keys())
        
        # Test proficiencies
        self.assertEqual(
            set(player.role_proficiency.keys()),
            set(PlayerGenerator.AGENT_ROLES.keys())
        )
        self.assertGreaterEqual(player.role_proficiency[player.role], 80)
        
        # Test agent proficiencies
        for agent in PlayerGenerator.AGENT_ROLES[player.role]:
            self.assertIn(agent, player.agent_proficiency)
            self.assertGreaterEqual(player.agent_proficiency[agent], 70)

    def test_generate_player_with_constraints(self):
        """Test player generation with specific constraints."""
        player = self.generator.generate_player(
            region='NA',
            role='Duelist',
            min_rating=80,
            max_rating=90
        )
        
        # Test constraints are met
        self.assertIn(player.nationality, PlayerGenerator.REGIONS['NA'])
        self.assertEqual(player.role, 'Duelist')
        
        # Test rating constraints
        core_stats = [
            player.aim,
            player.game_sense,
            player.movement,
            player.utility_usage,
            player.communication,
            player.clutch
        ]
        for stat in core_stats:
            self.assertGreaterEqual(stat, 80)
            self.assertLessEqual(stat, 90)

    def test_generate_player_edge_cases(self):
        """Test player generation with edge cases."""
        # Test minimum possible ratings
        min_player = self.generator.generate_player(min_rating=0, max_rating=1)
        core_stats = [
            min_player.aim,
            min_player.game_sense,
            min_player.movement,
            min_player.utility_usage,
            min_player.communication,
            min_player.clutch
        ]
        self.assertTrue(all(0 <= stat <= 1 for stat in core_stats))
        
        # Test maximum possible ratings
        max_player = self.generator.generate_player(min_rating=99, max_rating=100)
        core_stats = [
            max_player.aim,
            max_player.game_sense,
            max_player.movement,
            max_player.utility_usage,
            max_player.communication,
            max_player.clutch
        ]
        self.assertTrue(all(99 <= stat <= 100 for stat in core_stats))
        
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
            min_rating=70,
            max_rating=90,
            roster_size=roster_size
        )
        
        # Test roster size
        self.assertEqual(len(roster), roster_size)
        
        # Test all players are from EU
        for player in roster:
            self.assertIn(player.nationality, PlayerGenerator.REGIONS['EU'])
        
        # Test role distribution
        roles = [player.role for player in roster]
        self.assertIn('Duelist', roles)
        self.assertIn('Controller', roles)
        self.assertIn('Sentinel', roles)
        self.assertIn('Initiator', roles)
        
        # Test no duplicate players
        names = [player.name for player in roster]
        self.assertEqual(len(names), len(set(names)))

    def test_generate_team_roster_edge_cases(self):
        """Test team roster generation with edge cases."""
        # Test minimum roster size
        min_roster = self.generator.generate_team_roster(
            region='NA',
            roster_size=1
        )
        self.assertEqual(len(min_roster), 1)
        
        # Test large roster
        large_roster = self.generator.generate_team_roster(
            region='NA',
            roster_size=10
        )
        self.assertEqual(len(large_roster), 10)
        
        # Test invalid region
        with self.assertRaises(ValueError):
            self.generator.generate_team_roster(region='INVALID')
        
        # Test invalid roster size
        with self.assertRaises(ValueError):
            self.generator.generate_team_roster(region='NA', roster_size=0)
        
        # Test role distribution in minimum roster
        min_roster = self.generator.generate_team_roster(
            region='NA',
            roster_size=4
        )
        roles = [player.role for player in min_roster]
        core_roles = {'Duelist', 'Controller', 'Sentinel', 'Initiator'}
        self.assertGreaterEqual(len(core_roles.intersection(set(roles))), 3)

    def test_role_proficiencies(self):
        """Test role proficiency generation."""
        proficiencies = self.generator._generate_role_proficiencies('Duelist')
        
        # Test all roles are present
        self.assertEqual(
            set(proficiencies.keys()),
            set(PlayerGenerator.AGENT_ROLES.keys())
        )
        
        # Test primary role has higher proficiency
        self.assertGreaterEqual(proficiencies['Duelist'], 80)
        for role, value in proficiencies.items():
            if role != 'Duelist':
                self.assertLess(value, proficiencies['Duelist'])

    def test_core_stats_generation(self):
        """Test core stats generation with role-specific biases."""
        stats = self.generator._generate_core_stats(
            'Duelist',
            min_rating=70,
            max_rating=90
        )
        
        # Test all stats are present
        required_stats = ['aim', 'game_sense', 'movement', 'utility_usage', 'communication', 'clutch']
        self.assertEqual(set(stats.keys()), set(required_stats))
        
        # Test Duelist-specific biases
        self.assertGreaterEqual(stats['aim'], 75)  # Should have aim bonus
        self.assertGreaterEqual(stats['movement'], 75)  # Should have movement bonus

    def test_core_stats_edge_cases(self):
        """Test core stats generation with edge cases."""
        # Test minimum ratings
        min_stats = self.generator._generate_core_stats('Duelist', 0, 1)
        self.assertTrue(all(0 <= v <= 1 for v in min_stats.values()))
        
        # Test maximum ratings
        max_stats = self.generator._generate_core_stats('Duelist', 99, 100)
        self.assertTrue(all(99 <= v <= 100 for v in max_stats.values()))
        
        # Test invalid role
        with self.assertRaises(ValueError):
            self.generator._generate_core_stats('INVALID', 70, 90)
        
        # Test invalid rating range
        with self.assertRaises(ValueError):
            self.generator._generate_core_stats('Duelist', 90, 70)  # min > max

    def test_agent_proficiencies(self):
        """Test agent proficiency generation."""
        proficiencies = self.generator._generate_agent_proficiencies('Duelist', 90)
        
        # Test all agents are present
        all_agents = [agent for agents in PlayerGenerator.AGENT_ROLES.values() for agent in agents]
        self.assertEqual(set(proficiencies.keys()), set(all_agents))
        
        # Test primary role agents have higher proficiency
        for agent in PlayerGenerator.AGENT_ROLES['Duelist']:
            self.assertGreaterEqual(proficiencies[agent], 70)
        
        # Test other role agents have lower proficiency
        for role, agents in PlayerGenerator.AGENT_ROLES.items():
            if role != 'Duelist':
                for agent in agents:
                    self.assertLessEqual(proficiencies[agent], 70)

    def test_agent_proficiencies_edge_cases(self):
        """Test agent proficiency generation with edge cases."""
        # Test with minimum role rating
        min_proficiencies = self.generator._generate_agent_proficiencies('Duelist', 0)
        self.assertTrue(all(0 <= v <= 70 for v in min_proficiencies.values()))
        
        # Test with maximum role rating
        max_proficiencies = self.generator._generate_agent_proficiencies('Duelist', 100)
        self.assertTrue(any(v >= 90 for v in max_proficiencies.values()))
        
        # Test invalid role
        with self.assertRaises(ValueError):
            self.generator._generate_agent_proficiencies('INVALID', 90)

    def test_salary_calculation(self):
        """Test salary calculation based on stats and age."""
        stats = {
            'aim': 90,
            'game_sense': 85,
            'movement': 88,
            'utility_usage': 82,
            'communication': 80,
            'clutch': 85
        }
        
        # Test salary scaling with age and stats
        young_salary = self.generator._calculate_salary(stats, 18)
        prime_salary = self.generator._calculate_salary(stats, 23)
        veteran_salary = self.generator._calculate_salary(stats, 28)
        
        self.assertGreater(prime_salary, young_salary)
        self.assertGreater(veteran_salary, young_salary)
        
        # Test lower stats result in lower salary
        lower_stats = {k: v-20 for k, v in stats.items()}
        lower_salary = self.generator._calculate_salary(lower_stats, 23)
        self.assertGreater(prime_salary, lower_salary)

    def test_salary_calculation_edge_cases(self):
        """Test salary calculation with edge cases."""
        min_stats = {
            'aim': 0,
            'game_sense': 0,
            'movement': 0,
            'utility_usage': 0,
            'communication': 0,
            'clutch': 0
        }
        
        max_stats = {
            'aim': 100,
            'game_sense': 100,
            'movement': 100,
            'utility_usage': 100,
            'communication': 100,
            'clutch': 100
        }
        
        # Test minimum possible salary
        min_salary = self.generator._calculate_salary(min_stats, PlayerGenerator.MIN_AGE)
        self.assertGreaterEqual(min_salary, PlayerGenerator.BASE_SALARY * 0.5)  # Should have some minimum
        
        # Test maximum possible salary
        max_salary = self.generator._calculate_salary(max_stats, PlayerGenerator.MAX_AGE)
        self.assertGreater(max_salary, PlayerGenerator.BASE_SALARY * 5)  # Should be significantly higher
        
        # Test invalid age
        with self.assertRaises(ValueError):
            self.generator._calculate_salary(max_stats, PlayerGenerator.MIN_AGE - 1)
        
        with self.assertRaises(ValueError):
            self.generator._calculate_salary(max_stats, PlayerGenerator.MAX_AGE + 1)

if __name__ == '__main__':
    unittest.main() 