"""
Unit tests for the Player model.
"""
import unittest
from datetime import datetime
from app.models.player import Player

class TestPlayer(unittest.TestCase):
    def setUp(self):
        """Set up a test player before each test."""
        self.player = Player(
            name="Test Player",
            nationality="USA",
            age=22,
            salary=75000,
            role="Duelist",
            role_proficiency={
                "Duelist": 90,
                "Controller": 60,
                "Sentinel": 55,
                "Initiator": 65
            },
            agent_proficiency={
                "Jett": 95,
                "Raze": 85,
                "Omen": 60,
                "Sage": 55
            },
            aim=85,
            game_sense=80,
            movement=90,
            utility_usage=75,
            communication=70,
            clutch=80,
            form=75,
            fatigue=20,
            morale=80,
            matches_played=100,
            kills=2000,
            deaths=1600,
            assists=800,
            rounds_played=1800,
            first_bloods=300,
            clutches_won=90,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    def test_kd_ratio(self):
        """Test KD ratio calculation."""
        expected_kd = 2000 / 1600  # kills / deaths
        self.assertAlmostEqual(self.player.kd_ratio, expected_kd)

        # Test with zero deaths
        self.player.deaths = 0
        self.assertEqual(self.player.kd_ratio, 2000)  # should use max(1, deaths)

        # Test with zero kills
        self.player.kills = 0
        self.player.deaths = 100
        self.assertEqual(self.player.kd_ratio, 0)

    def test_kda_ratio(self):
        """Test KDA ratio calculation."""
        expected_kda = (2000 + 800) / 1600  # (kills + assists) / deaths
        self.assertAlmostEqual(self.player.kda_ratio, expected_kda)

        # Test with zero deaths
        self.player.deaths = 0
        expected_kda = 2000 + 800  # should use max(1, deaths)
        self.assertEqual(self.player.kda_ratio, expected_kda)

        # Test with zero everything
        self.player.kills = 0
        self.player.deaths = 0
        self.player.assists = 0
        self.assertEqual(self.player.kda_ratio, 0)

    def test_first_blood_percentage(self):
        """Test first blood percentage calculation."""
        expected_fb_percent = (300 / 2000) * 100  # (first_bloods / kills) * 100
        self.assertAlmostEqual(self.player.first_blood_percentage, expected_fb_percent)

        # Test with zero kills
        self.player.kills = 0
        self.assertEqual(self.player.first_blood_percentage, 0)

        # Test with more first bloods than kills (invalid state)
        self.player.kills = 10
        self.player.first_bloods = 20
        self.assertEqual(self.player.first_blood_percentage, 200)  # Should indicate invalid state

    def test_average_combat_score(self):
        """Test average combat score calculation."""
        total_score = (
            2000 * 200 +  # kills
            800 * 50 +    # assists
            300 * 100 +   # first bloods
            90 * 300      # clutches
        )
        expected_acs = total_score / 1800  # total / rounds_played
        self.assertAlmostEqual(self.player.average_combat_score, expected_acs)

        # Test with zero rounds
        self.player.rounds_played = 0
        total_score = (
            2000 * 200 +
            800 * 50 +
            300 * 100 +
            90 * 300
        )
        self.assertEqual(self.player.average_combat_score, total_score)  # should use max(1, rounds)

        # Test with zero everything
        self.player.kills = 0
        self.player.assists = 0
        self.player.first_bloods = 0
        self.player.clutches_won = 0
        self.assertEqual(self.player.average_combat_score, 0)

    def test_update_form_edge_cases(self):
        """Test form update with edge cases."""
        # Test extreme positive performance
        self.player.form = 50
        self.player.update_form(100)
        self.assertGreater(self.player.form, 50)
        self.assertLessEqual(self.player.form, 100)

        # Test extreme negative performance
        self.player.form = 50
        self.player.update_form(0)
        self.assertLess(self.player.form, 50)
        self.assertGreaterEqual(self.player.form, 0)

        # Test small changes
        self.player.form = 75
        initial_form = self.player.form
        self.player.update_form(76)  # Small positive change
        self.assertGreater(self.player.form, initial_form)
        self.assertLess(self.player.form - initial_form, 1)  # Change should be small

    def test_rest_edge_cases(self):
        """Test rest functionality with edge cases."""
        # Test rest at max form
        self.player.form = 100
        self.player.fatigue = 50
        self.player.rest()
        self.assertEqual(self.player.form, 100)  # Should stay at max
        self.assertLess(self.player.fatigue, 50)

        # Test rest at min fatigue
        self.player.form = 50
        self.player.fatigue = 0
        self.player.rest()
        self.assertEqual(self.player.fatigue, 0)  # Should stay at min
        self.assertGreater(self.player.form, 50)

        # Test multiple rests
        self.player.form = 50
        self.player.fatigue = 100
        for _ in range(5):
            self.player.rest()
        self.assertEqual(self.player.fatigue, 0)  # Should bottom out at 0
        self.assertLessEqual(self.player.form, 100)  # Should not exceed max

    def test_update_morale_edge_cases(self):
        """Test morale updates with edge cases."""
        # Test consecutive wins
        self.player.morale = 50
        for _ in range(6):
            self.player.update_morale(True)
        self.assertEqual(self.player.morale, 100)  # Should cap at 100

        # Test consecutive losses
        self.player.morale = 50
        for _ in range(6):
            self.player.update_morale(False)
        self.assertEqual(self.player.morale, 0)  # Should bottom out at 0

        # Test alternating results
        self.player.morale = 50
        initial_morale = self.player.morale
        self.player.update_morale(True)
        self.player.update_morale(False)
        self.assertEqual(self.player.morale, initial_morale)  # Should return to initial value

    def test_get_performance_rating_edge_cases(self):
        """Test performance rating with edge cases."""
        # Test perfect stats
        self.player.aim = 100
        self.player.game_sense = 100
        self.player.movement = 100
        self.player.utility_usage = 100
        self.player.communication = 100
        self.player.clutch = 100
        self.player.form = 100
        self.player.fatigue = 0
        self.player.morale = 100
        perfect_rating = self.player.get_performance_rating()
        self.assertGreaterEqual(perfect_rating, 100)  # Should be at or above 100 with modifiers

        # Test minimum stats
        self.player.aim = 0
        self.player.game_sense = 0
        self.player.movement = 0
        self.player.utility_usage = 0
        self.player.communication = 0
        self.player.clutch = 0
        self.player.form = 0
        self.player.fatigue = 100
        self.player.morale = 0
        min_rating = self.player.get_performance_rating()
        self.assertEqual(min_rating, 0)  # Should be 0

        # Test neutral stats
        self.player.aim = 50
        self.player.game_sense = 50
        self.player.movement = 50
        self.player.utility_usage = 50
        self.player.communication = 50
        self.player.clutch = 50
        self.player.form = 50
        self.player.fatigue = 50
        self.player.morale = 50
        neutral_rating = self.player.get_performance_rating()
        self.assertGreater(neutral_rating, min_rating)
        self.assertLess(neutral_rating, perfect_rating)

if __name__ == '__main__':
    unittest.main() 