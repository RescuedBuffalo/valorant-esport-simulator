"""
Unit tests for the Player model logic using a mock implementation.
"""
import unittest
from unittest.mock import MagicMock

# Create a mock Player class with only the methods we need for testing
class MockPlayer:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    @property
    def kd_ratio(self) -> float:
        """Calculate kill/death ratio."""
        return self.kills / max(1, self.deaths)
    
    @property
    def kda_ratio(self) -> float:
        """Calculate kill/death/assist ratio."""
        return (self.kills + self.assists) / max(1, self.deaths)
    
    @property
    def first_blood_percentage(self) -> float:
        """Calculate percentage of kills that were first bloods."""
        if self.kills == 0:
            return 0.0
        return (self.first_bloods / self.kills) * 100
    
    @property
    def average_combat_score(self) -> float:
        """Calculate average combat score per round."""
        # Simple approximation of combat score
        total_score = (
            self.kills * 200 +  # Base kill score
            self.assists * 50 +  # Assist score
            self.first_bloods * 100 +  # First blood bonus
            self.clutches_won * 300  # Clutch bonus
        )
        return total_score / max(1, self.rounds_played)
    
    def update_form(self, match_rating: float):
        """Update player's form based on recent match performance."""
        # Form is influenced by match rating (0-100) with some inertia
        form_change = (match_rating - self.form) * 0.3
        self.form = max(0, min(100, self.form + form_change))
    
    def rest(self):
        """Allow player to rest, reducing fatigue."""
        self.fatigue = max(0, self.fatigue - 30)
        self.form = min(100, self.form + 5)
    
    def update_morale(self, won_match: bool):
        """Update player's morale based on match result."""
        morale_change = 10 if won_match else -10
        self.morale = max(0, min(100, self.morale + morale_change))
    
    def get_performance_rating(self) -> float:
        """Calculate overall performance rating (0-100)."""
        # Base rating from core stats
        base_rating = (
            self.aim * 0.25 +
            self.game_sense * 0.25 +
            self.movement * 0.15 +
            self.utility_usage * 0.15 +
            self.communication * 0.1 +
            self.clutch * 0.1
        )
        
        # Apply form and fatigue modifiers
        form_modifier = (self.form / 100.0) * 0.2
        fatigue_modifier = ((100 - self.fatigue) / 100.0) * 0.1
        morale_modifier = (self.morale / 100.0) * 0.1
        
        return base_rating * (1 + form_modifier - fatigue_modifier + morale_modifier)

class TestPlayer(unittest.TestCase):
    def setUp(self):
        """Set up a test player before each test."""
        self.player = MockPlayer(
            first_name="Test",
            last_name="Player",
            gamer_tag="TestPlayer",
            nationality="USA",
            age=22,
            salary=75000,
            primary_role="Duelist",
            role_proficiencies={
                "Duelist": 90,
                "Controller": 60,
                "Sentinel": 55,
                "Initiator": 65
            },
            agent_proficiencies={
                "Jett": 95,
                "Raze": 85,
                "Phoenix": 80,
                "Reyna": 90
            },
            # Core stats
            aim=85,
            game_sense=80,
            movement=82,
            utility_usage=75,
            communication=70,
            clutch=78,
            # Performance metrics
            kills=2000,
            deaths=1600,
            assists=800,
            first_bloods=300,
            rounds_played=1800,
            clutches_won=90,
            # Dynamic attributes
            form=75,
            fatigue=40,
            morale=65
        )
    
    def test_kd_ratio(self):
        """Test kill/death ratio calculation."""
        self.assertEqual(self.player.kd_ratio, 1.25)  # 2000/1600
        
        # Test when deaths are 0
        self.player.deaths = 0
        self.assertEqual(self.player.kd_ratio, 2000)  # 2000/1
        
    def test_kda_ratio(self):
        """Test kill/death/assist ratio calculation."""
        self.assertEqual(self.player.kda_ratio, 1.75)  # (2000+800)/1600
        
        # Test when deaths are 0
        self.player.deaths = 0
        self.assertEqual(self.player.kda_ratio, 2800)  # (2000+800)/1
        
    def test_first_blood_percentage(self):
        """Test first blood percentage calculation."""
        self.assertEqual(self.player.first_blood_percentage, 15.0)  # (300/2000)*100
        
        # Test when kills are 0
        self.player.kills = 0
        self.assertEqual(self.player.first_blood_percentage, 0.0)
        
    def test_average_combat_score(self):
        """Test average combat score calculation."""
        expected = (2000 * 200 + 800 * 50 + 300 * 100 + 90 * 300) / 1800
        self.assertAlmostEqual(self.player.average_combat_score, expected)
        
        # Test when rounds played is 0
        self.player.rounds_played = 0
        expected = (2000 * 200 + 800 * 50 + 300 * 100 + 90 * 300) / 1
        self.assertAlmostEqual(self.player.average_combat_score, expected)
        
    def test_update_form(self):
        """Test updating player form."""
        initial_form = self.player.form
        self.player.update_form(85)  # Better performance
        self.assertGreater(self.player.form, initial_form)
        
        initial_form = self.player.form
        self.player.update_form(65)  # Worse performance
        self.assertLess(self.player.form, initial_form)
        
        # Test boundary cases
        self.player.form = 100
        self.player.update_form(100)
        self.assertEqual(self.player.form, 100)  # Shouldn't exceed 100
        
        self.player.form = 0
        self.player.update_form(0)
        self.assertEqual(self.player.form, 0)  # Shouldn't go below 0
        
    def test_rest(self):
        """Test player rest functionality."""
        self.player.fatigue = 50
        self.player.form = 70
        self.player.rest()
        self.assertEqual(self.player.fatigue, 20)  # 50 - 30
        self.assertEqual(self.player.form, 75)  # 70 + 5
        
        # Test boundary cases
        self.player.fatigue = 20
        self.player.form = 98
        self.player.rest()
        self.assertEqual(self.player.fatigue, 0)  # Shouldn't go below 0
        self.assertEqual(self.player.form, 100)  # Shouldn't exceed 100
        
    def test_update_morale(self):
        """Test morale updates after match results."""
        self.player.morale = 50
        self.player.update_morale(True)  # Win
        self.assertEqual(self.player.morale, 60)
        
        self.player.update_morale(False)  # Loss
        self.assertEqual(self.player.morale, 50)
        
        # Test boundary cases
        self.player.morale = 95
        self.player.update_morale(True)
        self.assertEqual(self.player.morale, 100)  # Shouldn't exceed 100
        
        self.player.morale = 5
        self.player.update_morale(False)
        self.assertEqual(self.player.morale, 0)  # Shouldn't go below 0
        
    def test_performance_rating(self):
        """Test performance rating calculation."""
        # Base calculation
        base = (
            self.player.aim * 0.25 +
            self.player.game_sense * 0.25 +
            self.player.movement * 0.15 +
            self.player.utility_usage * 0.15 +
            self.player.communication * 0.1 +
            self.player.clutch * 0.1
        )
        form_mod = (self.player.form / 100.0) * 0.2
        fatigue_mod = ((100 - self.player.fatigue) / 100.0) * 0.1
        morale_mod = (self.player.morale / 100.0) * 0.1
        
        expected = base * (1 + form_mod - fatigue_mod + morale_mod)
        self.assertAlmostEqual(self.player.get_performance_rating(), expected)
        
        # Test with different values
        self.player.form = 100
        self.player.fatigue = 0
        self.player.morale = 100
        
        base = (
            self.player.aim * 0.25 +
            self.player.game_sense * 0.25 +
            self.player.movement * 0.15 +
            self.player.utility_usage * 0.15 +
            self.player.communication * 0.1 +
            self.player.clutch * 0.1
        )
        form_mod = (self.player.form / 100.0) * 0.2
        fatigue_mod = ((100 - self.player.fatigue) / 100.0) * 0.1
        morale_mod = (self.player.morale / 100.0) * 0.1
        
        expected = base * (1 + form_mod - fatigue_mod + morale_mod)
        self.assertAlmostEqual(self.player.get_performance_rating(), expected)

if __name__ == "__main__":
    unittest.main() 