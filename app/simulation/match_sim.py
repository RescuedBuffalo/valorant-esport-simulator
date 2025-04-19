"""
Lightweight match simulation utility for Valorant.
Simulates matches between teams using the Player and Team dataclasses.
"""

import random
import math
import time
import logging
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

from app.simulation.player import Player
from app.simulation.team import Team


class MatchSimulator:
    """A lightweight match simulator for Valorant."""
    
    # Economic constants
    MAX_MONEY = 9000
    MIN_MONEY = 2000
    WIN_REWARD = 3000
    LOSS_REWARD = 1900
    LOSS_STREAK_BONUS = [500, 1000, 1500, 1900, 2400]
    PLANT_BONUS = 300
    
    def __init__(self):
        """Initialize the match simulator."""
        self.reset_match_state()
    
    def reset_match_state(self):
        """Reset all match state variables to defaults."""
        self.team_a_score = 0
        self.team_b_score = 0
        self.current_round = 0
        self.economy = {"team_a": 4000, "team_b": 4000}
        self.player_credits = {}  # Track individual player credits
        self.loss_streaks = {"team_a": 0, "team_b": 0}
        self.rounds = []
        self.player_performances = {
            "team_a": [],
            "team_b": []
        }
    
    def simulate_match(
        self, 
        team_a: Team, 
        team_b: Team, 
        team_a_players: List[Player], 
        team_b_players: List[Player]
    ) -> Dict[str, Any]:
        """
        Simulate a complete match between two teams.
        
        Args:
            team_a: Team A data
            team_b: Team B data
            team_a_players: List of players on team A
            team_b_players: List of players on team B
            
        Returns:
            Match results including scores, rounds, and player performances
        """
        self.reset_match_state()
        start_time = datetime.now()
        
        # Initialize player performances and credits
        self.player_performances = {
            "team_a": [self._init_player_performance(p) for p in team_a_players],
            "team_b": [self._init_player_performance(p) for p in team_b_players]
        }
        
        # Initialize player credits - 800 for pistol round
        for player in team_a_players + team_b_players:
            self.player_credits[player.id] = 800
        
        # Simulate rounds until match is complete
        while not self._is_match_complete():
            # Check if this is a pistol round (first round of each half)
            is_pistol_round = self.current_round == 0 or self.current_round == 12
            
            # If pistol round, reset player credits to 800
            if is_pistol_round:
                for player in team_a_players + team_b_players:
                    self.player_credits[player.id] = 800
                # Also reset team economy for clarity
                self.economy = {"team_a": 4000, "team_b": 4000}
            
            round_result = self._simulate_round(
                team_a, team_b, team_a_players, team_b_players, is_pistol_round
            )
            self.rounds.append(round_result)
            
            # Update score
            if round_result["winner"] == "team_a":
                self.team_a_score += 1
            else:
                self.team_b_score += 1
            
            # Update economy for next round
            self._update_economy(
                round_result["winner"], 
                round_result.get("spike_planted", False),
                team_a_players,
                team_b_players
            )
            
            # Update player performances
            self._update_player_performances(round_result["player_results"])
            
            self.current_round += 1
        
        # Calculate duration and finalize match result
        duration = (datetime.now() - start_time).total_seconds()
        
        # Sort player performances by combat score
        for team in ["team_a", "team_b"]:
            self.player_performances[team].sort(
                key=lambda x: x["combat_score"], 
                reverse=True
            )
        
        # Calculate MVP
        mvp = self._calculate_mvp()
        
        return {
            "team_a_score": self.team_a_score,
            "team_b_score": self.team_b_score,
            "rounds": self.rounds,
            "player_performances": self.player_performances,
            "duration": duration,
            "mvp": mvp
        }
    
    def _simulate_round(
        self, 
        team_a: Team, 
        team_b: Team, 
        team_a_players: List[Player], 
        team_b_players: List[Player],
        is_pistol_round: bool = False
    ) -> Dict[str, Any]:
        """
        Simulate a single round of play.
        
        Args:
            team_a: Team A data
            team_b: Team B data
            team_a_players: List of players on team A
            team_b_players: List of players on team B
            is_pistol_round: Whether this is a pistol round
            
        Returns:
            Round result data
        """
        # Determine attacker and defender teams based on round number
        attacking_team = "team_a" if self.current_round < 12 else "team_b"
        defending_team = "team_b" if attacking_team == "team_a" else "team_a"
        
        # Get the actual team and player objects
        att_team = team_a if attacking_team == "team_a" else team_b
        def_team = team_b if attacking_team == "team_a" else team_a
        att_players = team_a_players if attacking_team == "team_a" else team_b_players
        def_players = team_b_players if attacking_team == "team_a" else team_a_players
        
        # Simulate buy phase for each player
        player_loadouts = self._simulate_buy_phase(
            att_players, 
            def_players, 
            attacking_team, 
            defending_team,
            is_pistol_round
        )
        
        # Calculate team advantages (consider weapons from buy phase)
        att_advantage = self._calculate_team_advantage(att_team, att_players, "attack")
        def_advantage = self._calculate_team_advantage(def_team, def_players, "defense")
        
        # Add weapon advantage based on loadouts
        att_weapon_advantage = self._calculate_weapon_advantage(player_loadouts[attacking_team])
        def_weapon_advantage = self._calculate_weapon_advantage(player_loadouts[defending_team])
        att_advantage += att_weapon_advantage
        def_advantage += def_weapon_advantage
        
        # Economy advantage
        att_eco = self.economy[attacking_team]
        def_eco = self.economy[defending_team]
        eco_factor = 0.1 * (att_eco - def_eco) / 5000  # Scaled factor based on economy difference
        
        # Determine round state variables
        spike_planted = random.random() < (0.5 + att_advantage * 0.2)
        
        # Calculate win probability for attacking team
        base_win_prob = 0.5
        adjusted_win_prob = base_win_prob + att_advantage - def_advantage + eco_factor
        
        # If spike is planted, attackers get additional advantage
        if spike_planted:
            adjusted_win_prob += 0.15
        
        # Clamp probability between 0.2 and 0.8 to avoid certainty
        adjusted_win_prob = max(0.2, min(0.8, adjusted_win_prob))
        
        # Determine round winner
        winner = attacking_team if random.random() < adjusted_win_prob else defending_team
        
        # Simulate player performances
        player_results = self._simulate_player_performances(
            att_players, 
            def_players, 
            attacking_team,
            defending_team,
            winner,
            spike_planted,
            player_loadouts
        )
        
        # Generate round summary
        if winner == attacking_team:
            if spike_planted:
                summary = "Spike detonated"
            else:
                summary = "Attackers eliminated the defending team"
        else:
            if spike_planted:
                summary = "Defenders defused the spike"
            else:
                summary = "Defenders eliminated the attacking team"
        
        return {
            "winner": winner,
            "spike_planted": spike_planted,
            "player_results": player_results,
            "economy": {
                "team_a": self.economy["team_a"],
                "team_b": self.economy["team_b"]
            },
            "player_credits": self.player_credits.copy(),
            "player_loadouts": player_loadouts,
            "is_pistol_round": is_pistol_round,
            "summary": summary
        }
    
    def _simulate_buy_phase(
        self,
        att_players: List[Player],
        def_players: List[Player],
        att_team: str,
        def_team: str,
        is_pistol_round: bool
    ) -> Dict[str, Dict[str, Any]]:
        """
        Simulate players buying weapons and equipment.
        
        Args:
            att_players: List of attacking players
            def_players: List of defending players
            att_team: Team identifier for attackers
            def_team: Team identifier for defenders
            is_pistol_round: Whether this is a pistol round
            
        Returns:
            Dictionary of player loadouts
        """
        from .weapons import BuyPreferences
        
        loadouts = {
            att_team: {},
            def_team: {}
        }
        
        # Define round type based on economy and if it's a pistol round
        att_round_type = 'pistol' if is_pistol_round else self._determine_round_type(self.economy[att_team], self.loss_streaks[att_team])
        def_round_type = 'pistol' if is_pistol_round else self._determine_round_type(self.economy[def_team], self.loss_streaks[def_team])
        
        # Simulate buys for attacking team
        for player in att_players:
            buy_prefs = BuyPreferences(player.__dict__)
            credits = self.player_credits.get(player.id, 800 if is_pistol_round else 4000)
            
            # Determine buy
            weapon = buy_prefs.decide_buy(
                available_credits=credits,
                team_economy=self.economy[att_team],
                round_type=att_round_type
            )
            
            # Calculate cost of weapon
            from .weapons import WeaponFactory
            weapons = WeaponFactory.create_weapon_catalog()
            weapon_cost = weapons[weapon].cost
            
            # Determine if player buys armor (50% chance in pistol, otherwise based on economy)
            armor = False
            armor_cost = 0
            if (is_pistol_round and random.random() < 0.5 and credits >= weapon_cost + 400) or \
               (not is_pistol_round and credits >= weapon_cost + 1000):
                armor = True
                armor_cost = 400 if is_pistol_round else 1000
            
            # Calculate total spend
            total_spend = weapon_cost + armor_cost
            
            # Update player credits
            self.player_credits[player.id] = max(0, credits - total_spend)
            
            # Record loadout
            loadouts[att_team][player.id] = {
                "weapon": weapon,
                "armor": armor,
                "total_spend": total_spend
            }
        
        # Simulate buys for defending team
        for player in def_players:
            buy_prefs = BuyPreferences(player.__dict__)
            credits = self.player_credits.get(player.id, 800 if is_pistol_round else 4000)
            
            # Determine buy
            weapon = buy_prefs.decide_buy(
                available_credits=credits,
                team_economy=self.economy[def_team],
                round_type=def_round_type
            )
            
            # Calculate cost of weapon
            from .weapons import WeaponFactory
            weapons = WeaponFactory.create_weapon_catalog()
            weapon_cost = weapons[weapon].cost
            
            # Determine if player buys armor (50% chance in pistol, otherwise based on economy)
            armor = False
            armor_cost = 0
            if (is_pistol_round and random.random() < 0.5 and credits >= weapon_cost + 400) or \
               (not is_pistol_round and credits >= weapon_cost + 1000):
                armor = True
                armor_cost = 400 if is_pistol_round else 1000
            
            # Calculate total spend
            total_spend = weapon_cost + armor_cost
            
            # Update player credits
            self.player_credits[player.id] = max(0, credits - total_spend)
            
            # Record loadout
            loadouts[def_team][player.id] = {
                "weapon": weapon,
                "armor": armor,
                "total_spend": total_spend
            }
        
        return loadouts
    
    def _calculate_weapon_advantage(self, team_loadouts: Dict[str, Dict[str, Any]]) -> float:
        """
        Calculate weapon advantage based on team loadouts.
        
        Args:
            team_loadouts: Dictionary of player loadouts
            
        Returns:
            Weapon advantage factor
        """
        from .weapons import WeaponFactory, WeaponType
        
        weapons = WeaponFactory.create_weapon_catalog()
        advantage = 0.0
        
        for player_id, loadout in team_loadouts.items():
            weapon_name = loadout["weapon"]
            weapon = weapons.get(weapon_name)
            
            if not weapon:
                continue
            
            # Higher tier weapons give more advantage
            if weapon.type == WeaponType.RIFLE:
                advantage += 0.02
            elif weapon.type == WeaponType.SNIPER:
                advantage += 0.03
            elif weapon.type == WeaponType.SMG:
                advantage += 0.01
            
            # Armor gives slight advantage
            if loadout.get("armor", False):
                advantage += 0.01
        
        return advantage
    
    def _determine_round_type(self, team_economy: int, team_loss_streak: int) -> str:
        """
        Determine the round type for buying decisions.
        
        Args:
            team_economy: Total team economy
            team_loss_streak: Current loss streak
            
        Returns:
            Round type string
        """
        if team_economy >= 4000:
            return 'full_buy'
        elif team_economy >= 2500:
            return 'half_buy'
        elif team_loss_streak >= 2 or team_economy >= 2000:
            return 'force_buy'
        return 'eco'
    
    def _update_economy(
        self, 
        winner: str, 
        spike_planted: bool,
        team_a_players: List[Player],
        team_b_players: List[Player]
    ):
        """
        Update team economies based on round results.
        
        Args:
            winner: The winning team ('team_a' or 'team_b')
            spike_planted: Whether the spike was planted
            team_a_players: List of players on team A
            team_b_players: List of players on team B
        """
        loser = "team_b" if winner == "team_a" else "team_a"
        
        # Get player lists
        winning_players = team_a_players if winner == "team_a" else team_b_players
        losing_players = team_b_players if winner == "team_a" else team_a_players
        
        # Reset winner's loss streak, increment loser's
        self.loss_streaks[winner] = 0
        self.loss_streaks[loser] = min(self.loss_streaks[loser] + 1, 4)
        
        # Apply win reward to each winning player
        for player in winning_players:
            current_credits = self.player_credits.get(player.id, 0)
            self.player_credits[player.id] = min(self.MAX_MONEY, current_credits + self.WIN_REWARD)
        
        # Apply loss reward with streak bonus to each losing player
        loss_bonus = self.LOSS_STREAK_BONUS[self.loss_streaks[loser]]
        total_loss_reward = self.LOSS_REWARD + loss_bonus
        
        for player in losing_players:
            current_credits = self.player_credits.get(player.id, 0)
            # Ensure losing players don't go below MIN_MONEY and don't exceed MAX_MONEY
            self.player_credits[player.id] = max(
                self.MIN_MONEY,
                min(self.MAX_MONEY, current_credits + total_loss_reward)
            )
        
        # Add plant bonus to planting team players (divided among them)
        if spike_planted:
            # Determine planting team based on side (attack)
            planting_team = "team_a" if self.current_round % 24 < 12 else "team_b"
            planting_players = team_a_players if planting_team == "team_a" else team_b_players
            
            # Divide plant bonus among players (each gets full bonus)
            for player in planting_players:
                current_credits = self.player_credits.get(player.id, 0)
                self.player_credits[player.id] = min(
                    self.MAX_MONEY,
                    current_credits + self.PLANT_BONUS
                )
        
        # Update team economy totals (for reporting)
        self.economy["team_a"] = sum(self.player_credits.get(p.id, 0) for p in team_a_players) / len(team_a_players)
        self.economy["team_b"] = sum(self.player_credits.get(p.id, 0) for p in team_b_players) / len(team_b_players)
    
    def _is_match_complete(self) -> bool:
        """Check if the match is complete."""
        # Normal match ends at 13 rounds
        return self.team_a_score == 13 or self.team_b_score == 13
    
    def _calculate_team_advantage(
        self, 
        team: Team, 
        players: List[Player], 
        side: str
    ) -> float:
        """
        Calculate a team's advantage factor based on team and player stats.
        
        Args:
            team: Team data
            players: List of players on the team
            side: 'attack' or 'defense'
            
        Returns:
            Advantage factor, typically between -0.2 and 0.2
        """
        # Base advantage from team rating
        advantage = (team.rating - 75) / 100
        
        # Add chemistry factor
        advantage += (team.chemistry - 75) / 200
        
        # Add strategic preferences based on side
        if side == "attack":
            advantage += (team.strategy_preferences["aggression"] - 0.5) / 10
        else:
            advantage += (1 - team.strategy_preferences["aggression"]) / 10
        
        # Add player role effectiveness
        role_bonus = 0
        for player in players:
            if side == "attack" and player.primaryRole in ["duelist", "initiator"]:
                role_bonus += 0.01
            elif side == "defense" and player.primaryRole in ["sentinel", "controller"]:
                role_bonus += 0.01
        
        advantage += role_bonus
        
        # Clamp advantage to reasonable range
        return max(-0.2, min(0.2, advantage))
    
    def _simulate_player_performances(
        self,
        att_players: List[Player],
        def_players: List[Player],
        att_team: str,
        def_team: str,
        winner: str,
        spike_planted: bool,
        player_loadouts: Dict[str, Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Simulate individual player performances for the round.
        
        Args:
            att_players: List of attacking players
            def_players: List of defending players
            att_team: Team identifier for attackers
            def_team: Team identifier for defenders
            winner: Winning team identifier
            spike_planted: Whether spike was planted
            player_loadouts: Dictionary of player loadouts
            
        Returns:
            Dictionary of player performance results
        """
        results = {
            att_team: [],
            def_team: []
        }
        
        # Distribute kills between teams based on who won
        winning_team_kills = random.randint(3, 5)  # Winner gets 3-5 kills
        losing_team_kills = 5 - winning_team_kills  # Remaining kills for losers
        
        winning_players = att_players if winner == att_team else def_players
        losing_players = def_players if winner == att_team else att_players
        winning_team = att_team if winner == att_team else def_team
        losing_team = def_team if winner == att_team else att_team
        
        # Distribute kills among winning team, weighted by player rating
        winning_player_weights = [p.rating for p in winning_players]
        win_total = sum(winning_player_weights)
        win_normalized_weights = [w/win_total for w in winning_player_weights] if win_total > 0 else [0.2] * 5
        
        # Distribute kills among losing team
        losing_player_weights = [p.rating for p in losing_players]
        lose_total = sum(losing_player_weights)
        lose_normalized_weights = [w/lose_total for w in losing_player_weights] if lose_total > 0 else [0.2] * 5
        
        # Simulate kills for winning team
        win_kills = self._distribute_kills(
            winning_team_kills, 
            winning_players, 
            win_normalized_weights
        )
        
        # Simulate kills for losing team
        lose_kills = self._distribute_kills(
            losing_team_kills, 
            losing_players, 
            lose_normalized_weights
        )
        
        # Combine results
        results[winning_team] = win_kills
        results[losing_team] = lose_kills
        
        # Simulate spike plant and defuse if applicable
        if spike_planted:
            # Someone on attacking team gets a plant
            planter_idx = self._weighted_random_index(
                [p.coreStats.get("utility", 50) for p in att_players]
            )
            if att_team == winning_team:
                results[att_team][planter_idx]["plant"] = True
            else:
                results[att_team][planter_idx]["plant"] = True
                
                # If defending team won, someone defused
                defuser_idx = self._weighted_random_index(
                    [p.coreStats.get("utility", 50) for p in def_players]
                )
                results[def_team][defuser_idx]["defuse"] = True
        
        return results
    
    def _distribute_kills(
        self, 
        total_kills: int, 
        players: List[Player], 
        weights: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Distribute kills among players based on weights.
        
        Args:
            total_kills: Total kills to distribute
            players: List of players
            weights: Normalized weights for each player
            
        Returns:
            List of player results with kills, deaths, etc.
        """
        results = []
        
        # Distribute first bloods
        first_blood_player = None
        first_blood_idx = -1  # Initialize with invalid index
        
        if total_kills > 0:
            first_blood_idx = self._weighted_random_index(
                [p.coreStats.get("entry", 50) for p in players]
            )
            first_blood_player = players[first_blood_idx].id
        
        # Use weighted randomness to distribute kills
        kill_counts = [0] * len(players)
        death_counts = [1 if i != first_blood_idx else 0 for i in range(len(players))]
        
        # Distribute remaining kills
        remaining_kills = total_kills
        for _ in range(remaining_kills):
            idx = self._weighted_random_index(weights)
            kill_counts[idx] += 1
        
        # Calculate assists (typically 0-2 per player)
        assist_counts = [
            random.randint(0, 2) if random.random() < 0.7 else 0 
            for _ in range(len(players))
        ]
        
        # Generate results for each player
        for i, player in enumerate(players):
            combat_score = (kill_counts[i] * 150) + (assist_counts[i] * 50)
            
            # Add clutch probability based on clutch stat
            clutch = False
            if random.random() < (player.coreStats.get("clutch", 50) / 200):
                clutch = True
                combat_score += 100
            
            # Add first blood bonus
            first_blood = player.id == first_blood_player
            if first_blood:
                combat_score += 50
            
            result = {
                "player_id": player.id,
                "kills": kill_counts[i],
                "deaths": death_counts[i],
                "assists": assist_counts[i],
                "combat_score": combat_score,
                "first_blood": first_blood,
                "clutch": clutch,
                "plant": False,
                "defuse": False
            }
            
            results.append(result)
        
        return results
    
    def _weighted_random_index(self, weights: List[float]) -> int:
        """
        Select a random index based on weights.
        
        Args:
            weights: List of weights
            
        Returns:
            Selected index
        """
        total = sum(weights)
        if total <= 0:
            return random.randint(0, len(weights) - 1)
            
        r = random.uniform(0, total)
        cumulative = 0
        for i, weight in enumerate(weights):
            cumulative += weight
            if r <= cumulative:
                return i
        
        return len(weights) - 1
    
    def _init_player_performance(self, player: Player) -> Dict[str, Any]:
        """
        Initialize performance tracking for a player.
        
        Args:
            player: Player to track
            
        Returns:
            Initial performance stats dictionary
        """
        return {
            "player_id": player.id,
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "first_bloods": 0,
            "clutches": 0,
            "plants": 0,
            "defuses": 0,
            "combat_score": 0,
            "rounds_played": 0
        }
    
    def _update_player_performances(
        self, 
        round_results: Dict[str, List[Dict[str, Any]]]
    ):
        """
        Update overall player performances based on round results.
        
        Args:
            round_results: Player results from the round
        """
        for team, players in round_results.items():
            for player_result in players:
                player_id = player_result["player_id"]
                
                # Find the player in overall performances
                player_perf = next(
                    (p for p in self.player_performances[team] if p["player_id"] == player_id),
                    None
                )
                
                if player_perf:
                    player_perf["kills"] += player_result["kills"]
                    player_perf["deaths"] += player_result["deaths"]
                    player_perf["assists"] += player_result["assists"]
                    player_perf["combat_score"] += player_result["combat_score"]
                    player_perf["rounds_played"] += 1
                    
                    if player_result.get("first_blood", False):
                        player_perf["first_bloods"] += 1
                    
                    if player_result.get("clutch", False):
                        player_perf["clutches"] += 1
                    
                    if player_result.get("plant", False):
                        player_perf["plants"] += 1
                    
                    if player_result.get("defuse", False):
                        player_perf["defuses"] += 1
    
    def _calculate_mvp(self) -> str:
        """Calculate the MVP of the match based on performance."""
        # Combine all player performances
        all_performances = (
            self.player_performances["team_a"] + self.player_performances["team_b"]
        )
        
        # Score players by a formula
        scored_players = []
        for perf in all_performances:
            if perf["rounds_played"] == 0:
                continue
                
            # Calculate KD ratio
            kd = perf["kills"] / max(1, perf["deaths"])
            
            # MVP score formula
            mvp_score = (
                perf["combat_score"] / max(1, perf["rounds_played"]) * 0.5 +
                kd * 20 +
                perf["first_bloods"] * 5 +
                perf["clutches"] * 10
            )
            
            scored_players.append((perf["player_id"], mvp_score))
        
        # Return the player with the highest score
        if scored_players:
            return max(scored_players, key=lambda x: x[1])[0]
        
        # Fallback if no players
        return "" 