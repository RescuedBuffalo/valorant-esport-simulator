"""
Tests for the weapon system and buy phase functionality.
"""
import pytest
from app.simulation.weapons import WeaponFactory, BuyPreferences, WeaponType
from app.simulation.match_engine import MatchEngine

def test_weapon_factory():
    """Test weapon factory creates weapons with correct attributes."""
    factory = WeaponFactory()
    weapons = factory.create_weapon_catalog()
    
    # Test Vandal attributes
    vandal = weapons["Vandal"]
    assert vandal.name == "Vandal"
    assert vandal.type == WeaponType.RIFLE
    assert vandal.cost == 2900
    assert vandal.damage == 40
    assert vandal.range_multipliers == {"close": 1.0, "medium": 1.0, "long": 1.0}
    assert 0 <= vandal.accuracy <= 1
    assert 0 <= vandal.movement_accuracy <= 1
    
    # Test Classic attributes (free pistol)
    classic = weapons["Classic"]
    assert classic.cost == 0
    assert classic.type == WeaponType.SIDEARM

def test_buy_preferences():
    """Test buy decision making based on economy and player stats."""
    player_stats = {
        'id': '1',
        'coreStats': {
            'aim': 90,
            'utilityUsage': 70,
            'movement': 80,
            'gameSense': 85,
            'clutch': 75
        }
    }
    
    buy_prefs = BuyPreferences(player_stats)
    
    # Test eco round decisions
    eco_choice = buy_prefs.decide_buy(800, 3000, 'eco')
    assert eco_choice == 'Sheriff'  # High aim player should buy Sheriff on eco
    
    eco_choice_poor = buy_prefs.decide_buy(500, 2000, 'eco')
    assert eco_choice_poor == 'Classic'  # Not enough money for Sheriff
    
    # Test force buy decisions
    force_choice = buy_prefs.decide_buy(1600, 4000, 'force_buy')
    assert force_choice == 'Spectre'
    
    # Test full buy decisions for high aim player
    full_buy_choice = buy_prefs.decide_buy(4700, 7000, 'full_buy')
    assert full_buy_choice == 'Operator'  # High aim player should prefer Operator

def test_match_engine_buy_phase():
    """Test the buy phase in match engine."""
    match_engine = MatchEngine()
    match_engine.economy = {"team_a": 5000, "team_b": 5000}  # Initialize economy
    
    # Create a test team
    test_team = [{
        'id': str(i),
        'coreStats': {
            'aim': 85,
            'utilityUsage': 75,
            'movement': 80,
            'gameSense': 85,
            'clutch': 75
        }
    } for i in range(5)]
    
    # Test full buy round
    weapons, armor = match_engine._buy_phase(test_team, 5000, 0, "team_a")
    
    assert len(weapons) == 5  # Each player should have a weapon
    assert len(armor) == 5  # Each player should have armor status
    
    # At least some players should have rifles in a full buy
    rifles = [w for w in weapons.values() if w in ['Vandal', 'Phantom']]
    assert len(rifles) > 0
    
    # Test eco round
    match_engine.economy["team_a"] = 2000  # Reset economy for eco test
    weapons, armor = match_engine._buy_phase(test_team, 2000, 0, "team_a")
    
    # Most players should have Classic or Sheriff
    eco_weapons = [w for w in weapons.values() if w in ['Classic', 'Sheriff']]
    assert len(eco_weapons) >= 3

def test_weapon_based_duels():
    """Test that weapons properly influence duel outcomes."""
    match_engine = MatchEngine()
    
    attacker = {
        'id': '1',
        'coreStats': {
            'aim': 80,
            'utilityUsage': 70,
            'movement': 75,
            'gameSense': 75,
            'clutch': 70
        }
    }
    
    defender = {
        'id': '2',
        'coreStats': {
            'aim': 80,
            'utilityUsage': 70,
            'movement': 75,
            'gameSense': 75,
            'clutch': 70
        }
    }
    
    # Test Operator advantage at long range
    wins_long_range = sum(
        1 for _ in range(100)
        if match_engine._simulate_duel(
            attacker, defender,
            'Operator', 'Vandal',
            'long', True, True
        )
    )
    assert wins_long_range > 55  # Operator should win most long-range duels
    
    # Test SMG advantage at close range
    wins_close_range = sum(
        1 for _ in range(100)
        if match_engine._simulate_duel(
            attacker, defender,
            'Spectre', 'Vandal',
            'close', True, True
        )
    )
    assert wins_close_range > 35  # Spectre should be competitive at close range
    
    # Test armor effectiveness
    wins_no_armor = sum(
        1 for _ in range(100)
        if match_engine._simulate_duel(
            attacker, defender,
            'Vandal', 'Vandal',
            'medium', True, False  # Defender has no armor
        )
    )
    
    wins_with_armor = sum(
        1 for _ in range(100)
        if match_engine._simulate_duel(
            attacker, defender,
            'Vandal', 'Vandal',
            'medium', True, True  # Defender has armor
        )
    )
    
    assert wins_no_armor > wins_with_armor  # Armor should reduce damage taken 