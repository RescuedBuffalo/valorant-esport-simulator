"""
Match simulation engine for Valorant matches.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import random
import math
import uuid

# Simple simulation models
@dataclass
class SimMatch:
    team_a: List[Dict[str, Any]]
    team_b: List[Dict[str, Any]]
    map_name: str
    performances: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MatchPerformance:
    player_id: str
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    first_bloods: int = 0
    clutches: int = 0
    damage: int = 0

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

from .weapons import WeaponFactory, BuyPreferences, WeaponType

class MatchEngine:
    def __init__(self):
        self.current_match: Optional[SimMatch] = None
        self.round_number = 0
        self.score = {"team_a": 0, "team_b": 0}
        self.economy = {"team_a": 4000, "team_b": 4000}
        self.player_credits = {}  # Track individual player credits
        self.weapon_factory = WeaponFactory()
        self.weapons = self.weapon_factory.create_weapon_catalog()
        self.loss_streaks = {"team_a": 0, "team_b": 0}
        
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
        
        # Track team spending for economy analysis
        starting_economy = self.economy[team_id]
        total_spent = 0
        
        # Log the round type for debugging
        if hasattr(self, 'economy_logs') and self.economy_logs:
            current_log = self.economy_logs[-1]
            if isinstance(current_log['notes'], list):
                current_log['notes'].append(f"{team_id} round type: {round_type} with {starting_economy} credits")
        
        # Check if this is a pistol round (first of each half)
        is_pistol_round = self.round_number == 0 or self.round_number == 12
        
        for player in team:
            player_id = player['id']
            
            # Get the player's available credits, defaulting to 800 for pistol rounds
            if is_pistol_round:
                player_credits = 800
                self.player_credits[player_id] = 800
            else:
                player_credits = self.player_credits.get(player_id, 4000)
            
            buy_prefs = BuyPreferences(player)
            
            # Determine round type based on player's individual economy
            player_round_type = round_type
            if player_credits < 2000:
                player_round_type = 'eco'
            elif player_credits < 3900:  # Not enough for rifle + armor
                player_round_type = 'force_buy'
            
            # Only buy if we have enough money
            if player_credits > 0:
                weapon_choice = buy_prefs.decide_buy(
                    available_credits=player_credits,
                    team_economy=team_economy,
                    round_type=player_round_type
                )
                
                # Apply the weapon cost
                weapon_cost = self.weapons[weapon_choice].cost
                
                # Only subtract cost if we can afford it
                if player_credits >= weapon_cost:
                    self.player_credits[player_id] = player_credits - weapon_cost
                    total_spent += weapon_cost
                    weapons[player_id] = weapon_choice
                else:
                    # Default to classic if can't afford chosen weapon
                    weapons[player_id] = 'Classic'
                
                # Buy armor if can afford after weapon purchase
                player_credits = self.player_credits[player_id]  # Updated credits after weapon purchase
                armor_cost = 400 if is_pistol_round else 1000
                
                can_buy_armor = player_credits >= armor_cost
                should_buy_armor = (player_round_type != 'eco' or 
                                   (player_round_type == 'eco' and weapons[player_id] == 'Classic' and player_credits > armor_cost))
                
                if can_buy_armor and should_buy_armor:
                    self.player_credits[player_id] = player_credits - armor_cost
                    total_spent += armor_cost
                    armor[player_id] = True
                else:
                    armor[player_id] = False
            else:
                # If no money, default to classic
                weapons[player_id] = 'Classic'
                armor[player_id] = False
        
        # Ensure all players have at least a classic
        for player in team:
            player_id = player['id']
            if player_id not in weapons or not weapons[player_id]:
                weapons[player_id] = 'Classic'
            if player_id not in armor:
                armor[player_id] = False
            
        # Update the economy log for the current round if it exists
        if hasattr(self, 'economy_logs') and self.economy_logs:
            for log in reversed(self.economy_logs):
                if log['round_number'] == self.round_number:
                    log[f'{team_id}_spend'] = total_spent
                    # Update notes
                    if isinstance(log['notes'], str):
                        log['notes'] = log['notes'] + f'; {team_id} spent {total_spent} credits in buy phase'
                    else:
                        log['notes'].append(f"{team_id} spent {total_spent} credits in buy phase")
                    break
        
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
        # Initialize the economy log at the start of the round
        if hasattr(self, 'economy_logs'):
            economy_log = {
                'round_number': self.round_number,
                'team_a_start': self.economy['team_a'],
                'team_b_start': self.economy['team_b'],
                'team_a_spend': 0,
                'team_b_spend': 0,
                'notes': []
            }
            self.economy_logs.append(economy_log)
            
        # Check if this is a pistol round (first round of each half)
        is_pistol_round = self.round_number == 0 or self.round_number == 12
            
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
        
        # Compile player loadouts for the round
        player_loadouts = {
            "team_a": {},
            "team_b": {}
        }
        
        # Add loadout data for team A
        for player in self.current_match.team_a:
            player_id = player["id"]
            player_loadouts["team_a"][player_id] = {
                "weapon": round_weapons["team_a"].get(player_id, "Classic"),
                "armor": round_armor["team_a"].get(player_id, False),
                "total_spend": 0  # Will be calculated below
            }
            
            # Calculate the spend
            weapon_name = round_weapons["team_a"].get(player_id, "Classic")
            weapon_cost = self.weapons[weapon_name].cost if weapon_name in self.weapons else 0
            armor_cost = 1000 if round_armor["team_a"].get(player_id, False) else 0
            total_spend = weapon_cost + armor_cost
            player_loadouts["team_a"][player_id]["total_spend"] = total_spend
        
        # Add loadout data for team B
        for player in self.current_match.team_b:
            player_id = player["id"]
            player_loadouts["team_b"][player_id] = {
                "weapon": round_weapons["team_b"].get(player_id, "Classic"),
                "armor": round_armor["team_b"].get(player_id, False),
                "total_spend": 0  # Will be calculated below
            }
            
            # Calculate the spend
            weapon_name = round_weapons["team_b"].get(player_id, "Classic")
            weapon_cost = self.weapons[weapon_name].cost if weapon_name in self.weapons else 0
            armor_cost = 1000 if round_armor["team_b"].get(player_id, False) else 0
            total_spend = weapon_cost + armor_cost
            player_loadouts["team_b"][player_id]["total_spend"] = total_spend
        
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
        
        # Record spike plant status for economy
        if hasattr(self, 'economy_logs') and self.economy_logs:
            self.economy_logs[-1]['spike_planted'] = spike_planted
            self.economy_logs[-1]['winner'] = winner
        
        # Get player credits if we have a credits tracking mechanism
        player_credits = {}
        if hasattr(self, 'player_credits'):
            player_credits = self.player_credits.copy()
        
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
            "armor": round_armor,
            "player_loadouts": player_loadouts,
            "player_credits": player_credits,
            "is_pistol_round": is_pistol_round
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
        MIN_MONEY = 2000  # Minimum credits after round loss (changed from 1000)
        
        # Round win rewards
        WIN_REWARD = 3000
        LOSS_STREAK_BONUS = [1900, 2400, 2900, 3400, 3900]  # Increasing bonus for consecutive losses
        PLANT_BONUS = 300
        
        # Track loss streaks if not already initialized
        if not hasattr(self, 'loss_streaks'):
            self.loss_streaks = {'team_a': 0, 'team_b': 0}
            
        # Find the current economy log (should be the last one)
        current_log = None
        if hasattr(self, 'economy_logs') and self.economy_logs:
            for log in reversed(self.economy_logs):
                if log['round_number'] == self.round_number:
                    current_log = log
                    break
        
        # If no log was found, create a new one (shouldn't happen with the fixes)
        if not current_log and hasattr(self, 'economy_logs'):
            current_log = {
                'round_number': self.round_number,
                'team_a_start': self.economy['team_a'],
                'team_b_start': self.economy['team_b'],
                'team_a_spend': 0,
                'team_b_spend': 0,
                'winner': round_result['winner'],
                'spike_planted': round_result.get('spike_planted', False),
                'notes': []
            }
            self.economy_logs.append(current_log)
        
        winning_team = round_result['winner']
        losing_team = 'team_b' if winning_team == 'team_a' else 'team_a'
        
        # Calculate win reward
        win_reward = WIN_REWARD
        if current_log and isinstance(current_log['notes'], list):
            current_log['notes'].append(f"{winning_team} wins and gets {win_reward} credits")
        
        # Update winning team - ensure economy doesn't exceed MAX_MONEY
        start_economy = self.economy[winning_team]
        self.economy[winning_team] = min(MAX_MONEY, self.economy[winning_team] + win_reward)
        
        # Record reward
        if current_log:
            current_log[f'{winning_team}_reward'] = win_reward
            if self.economy[winning_team] == MAX_MONEY and start_economy + win_reward > MAX_MONEY:
                if isinstance(current_log['notes'], list):
                    current_log['notes'].append(f"{winning_team} hit max economy cap of {MAX_MONEY}")
            
        # Reset their loss streak
        self.loss_streaks[winning_team] = 0
        
        # Update losing team
        # Get appropriate loss bonus based on streak (max 4 = index 4 in bonus array)
        loss_streak = min(self.loss_streaks[losing_team], 4)
        loss_bonus = LOSS_STREAK_BONUS[loss_streak]
        
        if current_log and isinstance(current_log['notes'], list):
            current_log['notes'].append(f"{losing_team} loss streak: {loss_streak}, gets {loss_bonus} credits bonus")
        
        # Ensure losing team has at least MIN_MONEY credits after the round
        # and does not exceed MAX_MONEY
        start_economy = self.economy[losing_team]
        self.economy[losing_team] = max(
            MIN_MONEY,
            min(MAX_MONEY, self.economy[losing_team] + loss_bonus)
        )
        
        # Record reward
        if current_log:
            current_log[f'{losing_team}_reward'] = loss_bonus
            if self.economy[losing_team] == MIN_MONEY and start_economy + loss_bonus < MIN_MONEY:
                if isinstance(current_log['notes'], list):
                    current_log['notes'].append(f"{losing_team} hit min economy floor of {MIN_MONEY}")
            elif self.economy[losing_team] == MAX_MONEY and start_economy + loss_bonus > MAX_MONEY:
                if isinstance(current_log['notes'], list):
                    current_log['notes'].append(f"{losing_team} hit max economy cap of {MAX_MONEY}")
            
        # Increment their loss streak
        self.loss_streaks[losing_team] += 1
        
        # Add plant bonus if applicable - ensure economy cap is respected
        if round_result.get('spike_planted'):
            planting_team = 'team_a' if self.round_number % 2 == 0 else 'team_b'
            start_economy = self.economy[planting_team]
            
            # Apply plant bonus but don't exceed MAX_MONEY
            self.economy[planting_team] = min(
                MAX_MONEY,
                self.economy[planting_team] + PLANT_BONUS
            )
            
            if current_log and isinstance(current_log['notes'], list):
                current_log['notes'].append(f"{planting_team} gets {PLANT_BONUS} credits for planting the spike")
            
            # Update or add plant bonus to rewards
            if current_log:
                if f'{planting_team}_reward' in current_log:
                    current_log[f'{planting_team}_reward'] += PLANT_BONUS
                else:
                    current_log[f'{planting_team}_reward'] = PLANT_BONUS
                    
                if self.economy[planting_team] == MAX_MONEY and start_economy + PLANT_BONUS > MAX_MONEY:
                    if isinstance(current_log['notes'], list):
                        current_log['notes'].append(f"{planting_team} hit max economy cap of {MAX_MONEY}")
        
        # Update player credits too
        self._update_player_credits(winning_team, losing_team, round_result.get('spike_planted', False))
                
        # Record final economy values - ensure they don't exceed MAX_MONEY
        self.economy['team_a'] = min(MAX_MONEY, self.economy['team_a'])
        self.economy['team_b'] = min(MAX_MONEY, self.economy['team_b'])
        
        if current_log:
            current_log['team_a_end'] = self.economy['team_a']
            current_log['team_b_end'] = self.economy['team_b']
            
            # Convert notes to a single string at the end
            if isinstance(current_log['notes'], list):
                current_log['notes'] = '; '.join(current_log['notes'])
    
    def _update_player_credits(self, winning_team: str, losing_team: str, spike_planted: bool):
        """
        Update individual player credits based on round results.
        
        Args:
            winning_team: The team that won the round ('team_a' or 'team_b')
            losing_team: The team that lost the round
            spike_planted: Whether the spike was planted
        """
        # Valorant economy constants
        MAX_MONEY = 9000  # Maximum credits per round
        MIN_MONEY = 2000  # Minimum credits after round loss
        
        # Round win rewards
        WIN_REWARD = 3000
        LOSS_STREAK_BONUS = [1900, 2400, 2900, 3400, 3900]  # Increasing bonus for consecutive losses
        PLANT_BONUS = 300
        
        # Get the loss streak for the losing team
        loss_streak = min(self.loss_streaks.get(losing_team, 0), 4)  
        loss_bonus = LOSS_STREAK_BONUS[loss_streak]
        
        # Check if this is the start of a new half - reset credits to 800 for pistol
        is_new_half = self.round_number == 12
        
        # Get player lists based on team
        winning_players = self.current_match.team_a if winning_team == 'team_a' else self.current_match.team_b
        losing_players = self.current_match.team_b if winning_team == 'team_a' else self.current_match.team_a
        
        # Update credits for winning team players
        for player in winning_players:
            player_id = player.get('id')
            if player_id in self.player_credits:
                current_credits = self.player_credits[player_id]
                
                # For new half, set to 800 for pistol round
                if is_new_half:
                    self.player_credits[player_id] = 800
                else:
                    # Apply win reward, capped at MAX_MONEY
                    self.player_credits[player_id] = min(MAX_MONEY, current_credits + WIN_REWARD)
        
        # Update credits for losing team players
        for player in losing_players:
            player_id = player.get('id')
            if player_id in self.player_credits:
                current_credits = self.player_credits[player_id]
                
                # For new half, set to 800 for pistol round
                if is_new_half:
                    self.player_credits[player_id] = 800
                else:
                    # Apply loss bonus, ensuring minimum credits
                    self.player_credits[player_id] = max(
                        MIN_MONEY,
                        min(MAX_MONEY, current_credits + loss_bonus)
                    )
        
        # Apply plant bonus if applicable
        if spike_planted:
            planting_team = 'team_a' if self.round_number % 24 < 12 else 'team_b'
            planting_players = self.current_match.team_a if planting_team == 'team_a' else self.current_match.team_b
            
            # Give plant bonus to all players on planting team
            for player in planting_players:
                player_id = player.get('id')
                if player_id in self.player_credits and not is_new_half:
                    current_credits = self.player_credits[player_id]
                    self.player_credits[player_id] = min(MAX_MONEY, current_credits + PLANT_BONUS)
    
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
        # Initialize economy to 4,000 credits per team at the start of the match
        self.economy = {"team_a": 4000, "team_b": 4000}
        self.loss_streaks = {"team_a": 0, "team_b": 0}
        self.economy_logs = []
        
        # Initialize player credits - everyone starts with 800 for pistol round
        self.player_credits = {}
        for player in team_a + team_b:
            self.player_credits[player["id"]] = 800
        
        # Log the initial economy state
        self.economy_logs.append({
            'round_number': self.round_number,
            'team_a_start': self.economy['team_a'],
            'team_b_start': self.economy['team_b'],
            'team_a_spend': 0,
            'team_b_spend': 0,
            'team_a_end': self.economy['team_a'],
            'team_b_end': self.economy['team_b'],
            'team_a_reward': 0,
            'team_b_reward': 0,
            'winner': None,
            'spike_planted': False,
            'notes': ["Match start: Each team begins with 4000 credits"]
        })
        
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
        
        # Convert all note lists to strings for consistent output
        for log in self.economy_logs:
            if isinstance(log['notes'], list):
                log['notes'] = '; '.join(log['notes'])
        
        return {
            "score": self.score,
            "rounds": rounds,
            "duration": round(duration, 2),
            "map": map_name,
            "mvp": self._calculate_mvp(),
            "economy_logs": self.economy_logs
        } 