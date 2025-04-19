"""
Match simulation engine for Valorant matches.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import random
import math

from app.models.match import SimMatch, MatchPerformance
from app.models.player import Player
from app.models.team import Team
from .weapons import WeaponFactory, BuyPreferences, WeaponType

@dataclass
class RoundState:
    """Current state of a round."""
    round_number: int
    team_a_credits: int
    team_b_credits: int
    team_a_players_alive: List[Dict]
    team_b_players_alive: List[Dict]
    time_remaining: int  # seconds
    spike_planted: bool
    plant_site: Optional[str]
    ultimates_available_a: Dict[str, bool]  # player_id: has_ultimate
    ultimates_available_b: Dict[str, bool]
    team_a_weapons: Dict[str, str]  # player_id: weapon_name
    team_b_weapons: Dict[str, str]
    team_a_armor: Dict[str, bool]  # player_id: has_armor
    team_b_armor: Dict[str, bool]

class MatchEngine:
    def __init__(self):
        self.current_match: Optional[SimMatch] = None
        self.round_number = 0
        self.score = {"team_a": 0, "team_b": 0}
        self.economy = {"team_a": 4000, "team_b": 4000}
        self.weapon_factory = WeaponFactory()
        self.weapons = self.weapon_factory.create_weapon_catalog()
        
    def _determine_round_type(self, team_economy: int, team_loss_streak: int) -> str:
        """Determine if the team should eco, force buy, or full buy."""
        if team_economy >= 4000:
            return 'full_buy'
        elif team_loss_streak >= 2 or team_economy >= 2000:
            return 'force_buy'
        return 'eco'
    
    def _buy_phase(self, team: List[Dict], team_economy: int, team_loss_streak: int, team_id: str) -> Tuple[Dict[str, str], Dict[str, bool]]:
        """
        Simulate the buy phase for a team.
        
        Args:
            team: List of player dictionaries
            team_economy: Total team economy
            team_loss_streak: Current loss streak
            team_id: 'team_a' or 'team_b'
            
        Returns:
            Tuple of (weapons dict, armor dict)
        """
        weapons = {}
        armor = {}
        round_type = self._determine_round_type(team_economy, team_loss_streak)
        
        for player in team:
            buy_prefs = BuyPreferences(player)
            weapon_choice = buy_prefs.decide_buy(
                available_credits=self.economy[team_id],
                team_economy=team_economy,
                round_type=round_type
            )
            
            # Apply the weapon cost
            weapon_cost = self.weapons[weapon_choice].cost
            self.economy[team_id] -= weapon_cost
            weapons[player['id']] = weapon_choice
            
            # Buy armor if can afford (1000 credits)
            can_buy_armor = self.economy[team_id] >= 1000
            if can_buy_armor and round_type != 'eco':
                self.economy[team_id] -= 1000
                armor[player['id']] = True
            else:
                armor[player['id']] = False
        
        return weapons, armor
    
    def _simulate_duel(
        self,
        attacker: Dict[str, Any],
        defender: Dict[str, Any],
        attacker_weapon: str,
        defender_weapon: str,
        distance: str,  # 'close', 'medium', 'long'
        attacker_armor: bool,
        defender_armor: bool
    ) -> bool:
        """
        Simulates a 1v1 duel between two players with their weapons.
        
        Returns:
            True if attacker wins, False if defender wins
        """
        att_weapon = self.weapons[attacker_weapon]
        def_weapon = self.weapons[defender_weapon]
        
        # Base ratings modified by weapon stats
        attacker_rating = (
            attacker["coreStats"]["aim"] * 0.4 * att_weapon.accuracy +
            attacker["coreStats"]["movement"] * 0.3 * att_weapon.movement_accuracy +
            attacker["coreStats"]["gameSense"] * 0.3
        )
        
        defender_rating = (
            defender["coreStats"]["aim"] * 0.4 * def_weapon.accuracy +
            defender["coreStats"]["movement"] * 0.3 * def_weapon.movement_accuracy +
            defender["coreStats"]["gameSense"] * 0.3
        )
        
        # Apply weapon-specific modifiers
        attacker_rating *= att_weapon.range_multipliers[distance]
        defender_rating *= def_weapon.range_multipliers[distance]
        
        # Special cases for weapon types
        if att_weapon.type == WeaponType.SNIPER and distance == "long":
            attacker_rating *= 1.5  # Increased from 1.2 to make snipers more dominant at range
        if def_weapon.type == WeaponType.SMG and distance == "close":
            defender_rating *= 1.2  # Increased from 1.1 to make SMGs more effective close range
            
        # Armor reduces damage
        if defender_armor:
            attacker_rating *= (1 - (1 - att_weapon.armor_penetration) * 0.5)
        if attacker_armor:
            defender_rating *= (1 - (1 - def_weapon.armor_penetration) * 0.5)
            
        # Add some randomness
        attacker_roll = attacker_rating * random.uniform(0.8, 1.2)
        defender_roll = defender_rating * random.uniform(0.8, 1.2)
        
        return attacker_roll > defender_roll
    
    def _simulate_round(self) -> Dict[str, Any]:
        """Simulates a single round of play."""
        # Buy phase
        team_a_weapons, team_a_armor = self._buy_phase(
            self.current_match.team_a,
            self.economy["team_a"],
            self.loss_streaks.get("team_a", 0),
            "team_a"
        )
        team_b_weapons, team_b_armor = self._buy_phase(
            self.current_match.team_b,
            self.economy["team_b"],
            self.loss_streaks.get("team_b", 0),
            "team_b"
        )
        
        # Initialize round state
        alive_players = {
            "team_a": self.current_match.team_a.copy(),
            "team_b": self.current_match.team_b.copy()
        }
        spike_planted = False
        plant_time = None
        clutch_player = None
        
        # Track weapons and armor
        round_weapons = {
            "team_a": team_a_weapons,
            "team_b": team_b_weapons
        }
        round_armor = {
            "team_a": team_a_armor,
            "team_b": team_b_armor
        }
        
        # Simulate pre-plant phase
        while len(alive_players["team_a"]) > 0 and len(alive_players["team_b"]) > 0 and not spike_planted:
            # Simulate engagements
            if random.random() < 0.7:  # 70% chance of engagement
                attacking_team = "team_a" if self.round_number % 2 == 0 else "team_b"
                defending_team = "team_b" if attacking_team == "team_a" else "team_a"
                
                attacker = random.choice(alive_players[attacking_team])
                defender = random.choice(alive_players[defending_team])
                
                # Determine engagement distance
                distance = random.choice(["close", "medium", "long"])
                
                # Get weapons and armor
                att_weapon = round_weapons[attacking_team][attacker["id"]]
                def_weapon = round_weapons[defending_team][defender["id"]]
                att_armor = round_armor[attacking_team][attacker["id"]]
                def_armor = round_armor[defending_team][defender["id"]]
                
                if self._simulate_duel(
                    attacker,
                    defender,
                    att_weapon,
                    def_weapon,
                    distance,
                    att_armor,
                    def_armor
                ):
                    alive_players[defending_team].remove(defender)
                else:
                    alive_players[attacking_team].remove(attacker)
                    
                # Check for clutch situation
                if len(alive_players[attacking_team]) == 1 and len(alive_players[defending_team]) >= 2:
                    clutch_player = list(alive_players[attacking_team])[0]["id"]
            
            # Chance to plant spike
            if self.round_number % 2 == 0 and len(alive_players["team_a"]) > 0:
                if random.random() < 0.3:  # 30% chance to plant
                    spike_planted = True
                    plant_time = datetime.now()
        
        # Determine round winner
        winner = self._determine_round_winner(alive_players, spike_planted)
        
        return {
            "winner": winner,
            "economy": self.economy.copy(),
            "spike_planted": spike_planted,
            "clutch_player": clutch_player,
            "survivors": {
                "team_a": len(alive_players["team_a"]),
                "team_b": len(alive_players["team_b"])
            },
            "weapons": round_weapons,
            "armor": round_armor
        }
    
    def _determine_round_winner(self, alive_players: Dict[str, List[Dict[str, Any]]], spike_planted: bool) -> str:
        """
        Determines the winner of a round based on current state.
        
        Args:
            alive_players: Dictionary containing lists of alive players for each team
            spike_planted: Whether the spike is planted
            
        Returns:
            "team_a" or "team_b"
        """
        if self.round_number % 2 == 0:  # Team A attacking
            if len(alive_players["team_b"]) == 0:
                return "team_a"  # All defenders eliminated
            elif len(alive_players["team_a"]) == 0:
                return "team_b"  # All attackers eliminated
            elif spike_planted:
                return "team_a"  # Spike detonated
            else:
                return "team_b"  # Time ran out
        else:  # Team B attacking
            if len(alive_players["team_a"]) == 0:
                return "team_b"
            elif len(alive_players["team_b"]) == 0:
                return "team_a"
            elif spike_planted:
                return "team_b"
            else:
                return "team_a"
    
    def _update_economy(self, round_result: Dict[str, Any]):
        """
        Updates team economies based on round result.
        
        Args:
            round_result: Dictionary containing round results
        """
        # Valorant economy constants
        MAX_MONEY = 9000  # Maximum credits per round
        MIN_MONEY = 1000  # Minimum credits after round loss (changed from 0)
        
        # Round win rewards
        WIN_REWARD = 3000
        LOSS_STREAK_BONUS = [1900, 2400, 2900, 3400, 3900]  # Increasing bonus for consecutive losses
        PLANT_BONUS = 300
        
        # Track loss streaks if not already initialized
        if not hasattr(self, 'loss_streaks'):
            self.loss_streaks = {'team_a': 0, 'team_b': 0}
        
        winning_team = round_result['winner']
        losing_team = 'team_b' if winning_team == 'team_a' else 'team_a'
        
        # Update winning team
        self.economy[winning_team] = min(
            MAX_MONEY,
            self.economy[winning_team] + WIN_REWARD
        )
        # Reset their loss streak
        self.loss_streaks[winning_team] = 0
        
        # Update losing team
        # Get appropriate loss bonus based on streak (max 4 = index 4 in bonus array)
        loss_streak = min(self.loss_streaks[losing_team], 4)
        loss_bonus = LOSS_STREAK_BONUS[loss_streak]
        
        # Ensure losing team has at least MIN_MONEY credits after the round
        self.economy[losing_team] = max(
            MIN_MONEY,
            min(MAX_MONEY, self.economy[losing_team] + loss_bonus)
        )
        # Increment their loss streak
        self.loss_streaks[losing_team] += 1
        
        # Add plant bonus if applicable
        if round_result.get('spike_planted'):
            planting_team = 'team_a' if self.round_number % 2 == 0 else 'team_b'
            self.economy[planting_team] = min(
                MAX_MONEY,
                self.economy[planting_team] + PLANT_BONUS
            )
    
    def _is_match_complete(self) -> bool:
        """
        Checks if the match is complete.
        
        Returns:
            True if a team has won, False otherwise
        """
        return (
            self.score["team_a"] >= 13 or
            self.score["team_b"] >= 13
        )
    
    def _calculate_mvp(self) -> Optional[str]:
        """
        Calculates the MVP of the match.
        
        Returns:
            Player ID of the MVP
        """
        if not self.current_match:
            return None
            
        best_performance = None
        mvp_id = None
        
        for player in self.current_match.team_a + self.current_match.team_b:
            performance = player["careerStats"]["kdRatio"] * 0.4 + \
                         player["careerStats"]["clutchRate"] * 0.3 + \
                         player["careerStats"]["firstBloodRate"] * 0.3
                         
            if not best_performance or performance > best_performance:
                best_performance = performance
                mvp_id = player["id"]
                
        return mvp_id

    def simulate_match(self, team_a: List[Dict[str, Any]], team_b: List[Dict[str, Any]], map_name: str) -> Dict[str, Any]:
        """
        Simulates a complete match between two teams.
        
        Args:
            team_a: List of player dictionaries for team A
            team_b: List of player dictionaries for team B
            map_name: Name of the map being played
            
        Returns:
            Dictionary containing match results
        """
        self.current_match = SimMatch(team_a, team_b, map_name)
        self.round_number = 0
        self.score = {"team_a": 0, "team_b": 0}
        self.economy = {"team_a": 4000, "team_b": 4000}
        self.loss_streaks = {"team_a": 0, "team_b": 0}
        
        rounds = []
        start_time = datetime.now()
        
        while not self._is_match_complete():
            round_result = self._simulate_round()
            rounds.append(round_result)
            
            # Update score
            if round_result["winner"] == "team_a":
                self.score["team_a"] += 1
            else:
                self.score["team_b"] += 1
                
            # Update economy
            self._update_economy(round_result)
            
            self.round_number += 1
        
        duration = (datetime.now() - start_time).total_seconds() / 60
        
        return {
            "score": self.score,
            "rounds": rounds,
            "duration": round(duration, 2),
            "map": map_name,
            "mvp": self._calculate_mvp()
        } 