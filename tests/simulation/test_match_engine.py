import pytest
from app.simulation.match_engine import MatchEngine
from app.simulation.player_generator import PlayerGenerator

def test_match_engine_economy():
    """Test the economy system in the match engine."""
    # Initialize the match engine and player generator
    match_engine = MatchEngine()
    player_gen = PlayerGenerator()
    
    # Generate two teams
    team_a = player_gen.generate_team_roster(region="NA", size=5)
    team_b = player_gen.generate_team_roster(region="EU", size=5)
    
    # Simulate a match
    match_result = match_engine.simulate_match(team_a, team_b, "Ascent")
    
    # Basic assertions about the match
    assert isinstance(match_result, dict)
    assert "score" in match_result
    assert "rounds" in match_result
    assert len(match_result["rounds"]) > 0
    
    # Test economy system
    for round_data in match_result["rounds"]:
        # Check economy data exists
        assert "economy" in round_data
        assert "team_a" in round_data["economy"]
        assert "team_b" in round_data["economy"]
        
        # Verify economy limits
        assert 0 <= round_data["economy"]["team_a"] <= 15000
        assert 0 <= round_data["economy"]["team_b"] <= 15000
        
        # Check if spike plant bonus is properly applied
        if round_data.get("spike_planted"):
            attacking_team = "team_a" if match_engine.round_number % 2 == 0 else "team_b"
            assert round_data["economy"][attacking_team] <= 15000  # Should include plant bonus but not exceed cap

def test_loss_bonus_system():
    """Test the loss bonus streak system."""
    match_engine = MatchEngine()
    
    # Simulate consecutive losses
    for i in range(5):
        round_result = {
            "winner": "team_a",
            "spike_planted": False
        }
        match_engine._update_economy(round_result)
        
        # Loss bonus should increase with each loss
        expected_bonus = [1900, 2400, 2900, 3400, 3900][i]
        assert match_engine.loss_streaks["team_b"] == i + 1
        
    # Test reset of loss streak after a win
    round_result = {
        "winner": "team_b",
        "spike_planted": False
    }
    match_engine._update_economy(round_result)
    assert match_engine.loss_streaks["team_b"] == 0

def test_spike_plant_bonus():
    """Test the spike plant bonus system."""
    match_engine = MatchEngine()
    initial_economy = match_engine.economy["team_a"]
    
    # Simulate a round with spike plant
    round_result = {
        "winner": "team_b",
        "spike_planted": True
    }
    match_engine.round_number = 0  # Set to team A attacking
    match_engine._update_economy(round_result)
    
    # Verify plant bonus (300) is added but doesn't exceed cap
    assert match_engine.economy["team_a"] <= 9000
    assert match_engine.economy["team_a"] >= min(9000, initial_economy + 300) 