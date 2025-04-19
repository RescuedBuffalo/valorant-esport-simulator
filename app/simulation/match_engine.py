"""
Match simulation engine for Valorant matches.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import random
import math

from app.models.match import Match, MatchPerformance
from app.models.player import Player
from app.models.team import Team

@dataclass
class RoundState:
    """Current state of a round."""
    round_number: int
    team_a_credits: int
    team_b_credits: int
    team_a_players_alive: List[Player]
    team_b_players_alive: List[Player]
    time_remaining: int  # seconds
    spike_planted: bool
    plant_site: Optional[str]
    ultimates_available_a: Dict[str, bool]  # player_id: has_ultimate
    ultimates_available_b: Dict[str, bool]

class MatchSimulator:
    """Simulates Valorant matches with detailed round-by-round simulation."""
    
    # Constants
    ROUND_TIME = 100  # seconds
    SPIKE_PLANT_TIME = 4
    SPIKE_DEFUSE_TIME = 7
    POST_PLANT_TIME = 45
    
    # Economy
    STARTING_CREDITS = 800
    LOSS_BONUS_BASE = 1900
    LOSS_BONUS_INCREMENT = 500
    MAX_LOSS_BONUS = 2900
    KILL_REWARD = 200
    ROUND_WIN_REWARD = 3000
    PLANT_REWARD = 300
    
    # Map-specific attack/defense advantages
    MAP_SIDE_ADVANTAGE = {
        'Ascent': {'attack': 0.48, 'defense': 0.52},
        'Bind': {'attack': 0.49, 'defense': 0.51},
        'Haven': {'attack': 0.51, 'defense': 0.49},
        'Split': {'attack': 0.47, 'defense': 0.53},
        'Icebox': {'attack': 0.50, 'defense': 0.50},
        'Breeze': {'attack': 0.51, 'defense': 0.49},
        'Fracture': {'attack': 0.52, 'defense': 0.48},
        'Pearl': {'attack': 0.49, 'defense': 0.51},
        'Lotus': {'attack': 0.50, 'defense': 0.50},
        'Sunset': {'attack': 0.50, 'defense': 0.50},
    }
    
    def __init__(self, match: Match):
        self.match = match
        self.team_a = match.team_a
        self.team_b = match.team_b
        self.map_name = match.map_name
        self.performances: Dict[str, MatchPerformance] = {}
        
        # Initialize performance tracking for all players
        for player in self.team_a.active_roster + self.team_b.active_roster:
            self.performances[player.id] = MatchPerformance(
                match_id=match.id,
                player_id=player.id,
                team_id=player.team_id
            )
    
    def simulate_match(self) -> Match:
        """Simulate entire match."""
        self.match.status = "in_progress"
        self.match.start_time = datetime.utcnow()
        
        # Initialize economy
        team_a_credits = {p.id: self.STARTING_CREDITS for p in self.team_a.active_roster}
        team_b_credits = {p.id: self.STARTING_CREDITS for p in self.team_b.active_roster}
        team_a_loss_bonus = 0
        team_b_loss_bonus = 0
        
        # Simulate rounds until a winner is determined
        while not self._is_match_complete():
            round_result = self.simulate_round(
                self.match.current_round + 1,
                team_a_credits,
                team_b_credits
            )
            
            # Update match state
            self.match.rounds.append(round_result)
            self.match.current_round += 1
            
            # Update scores
            if round_result['winner'] == 'team_a':
                self.match.team_a_score += 1
                team_b_loss_bonus = min(4, team_b_loss_bonus + 1)
                team_a_loss_bonus = 0
            else:
                self.match.team_b_score += 1
                team_a_loss_bonus = min(4, team_a_loss_bonus + 1)
                team_b_loss_bonus = 0
            
            # Update economy for next round
            self._update_economy(
                round_result,
                team_a_credits,
                team_b_credits,
                team_a_loss_bonus,
                team_b_loss_bonus
            )
        
        # Finalize match
        self._finalize_match()
        return self.match
    
    def simulate_round(
        self,
        round_number: int,
        team_a_credits: Dict[str, int],
        team_b_credits: Dict[str, int]
    ) -> Dict:
        """Simulate a single round."""
        # Initialize round state
        state = RoundState(
            round_number=round_number,
            team_a_credits=sum(team_a_credits.values()),
            team_b_credits=sum(team_b_credits.values()),
            team_a_players_alive=list(self.team_a.active_roster),
            team_b_players_alive=list(self.team_b.active_roster),
            time_remaining=self.ROUND_TIME,
            spike_planted=False,
            plant_site=None,
            ultimates_available_a={p.id: random.random() < 0.2 for p in self.team_a.active_roster},
            ultimates_available_b={p.id: random.random() < 0.2 for p in self.team_b.active_roster}
        )
        
        events = []
        
        # Pre-round calculations
        attacking_team = 'team_a' if self._is_team_a_attacking(round_number) else 'team_b'
        map_advantage = self.MAP_SIDE_ADVANTAGE[self.map_name]
        
        # Simulate round events
        while not self._is_round_over(state):
            event = self._simulate_next_event(state, attacking_team, map_advantage)
            if event:
                events.append(event)
                self._apply_event(state, event)
        
        # Determine round winner and create round result
        winner = self._determine_round_winner(state)
        round_result = {
            'round_number': round_number,
            'winner': winner,
            'events': events,
            'time_remaining': state.time_remaining,
            'spike_planted': state.spike_planted,
            'plant_site': state.plant_site
        }
        
        # Update player performances
        self._update_performances(round_result)
        
        return round_result
    
    def _is_team_a_attacking(self, round_number: int) -> bool:
        """Determine if team A is attacking based on round number."""
        first_half = round_number <= 12
        team_a_started_attack = self.match.team_a_side_first == "attack"
        
        if self.match.overtime_rounds > 0:
            return (round_number % 2) == (1 if team_a_started_attack else 0)
        
        return (first_half and team_a_started_attack) or (not first_half and not team_a_started_attack)
    
    def _simulate_next_event(
        self,
        state: RoundState,
        attacking_team: str,
        map_advantage: Dict[str, float]
    ) -> Optional[Dict]:
        """Simulate the next event in the round."""
        # List of possible events and their base probabilities
        events = [
            ('combat', 0.6),
            ('utility', 0.2),
            ('spike_plant', 0.1 if not state.spike_planted else 0),
            ('spike_defuse', 0.1 if state.spike_planted else 0)
        ]
        
        event_type = random.choices(
            [e[0] for e in events],
            weights=[e[1] for e in events]
        )[0]
        
        if event_type == 'combat':
            return self._simulate_combat(state, attacking_team, map_advantage)
        elif event_type == 'utility':
            return self._simulate_utility_usage(state)
        elif event_type == 'spike_plant':
            return self._simulate_spike_plant(state, attacking_team)
        elif event_type == 'spike_defuse':
            return self._simulate_spike_defuse(state, attacking_team)
        
        return None
    
    def _simulate_combat(
        self,
        state: RoundState,
        attacking_team: str,
        map_advantage: Dict[str, float]
    ) -> Optional[Dict]:
        """Simulate a combat encounter between players."""
        if not state.team_a_players_alive or not state.team_b_players_alive:
            return None
            
        # Select random players for the duel
        attacker = random.choice(
            state.team_a_players_alive if attacking_team == 'team_a'
            else state.team_b_players_alive
        )
        defender = random.choice(
            state.team_b_players_alive if attacking_team == 'team_a'
            else state.team_a_players_alive
        )
        
        # Calculate duel win probability
        attacker_rating = self._calculate_combat_rating(attacker, True, state)
        defender_rating = self._calculate_combat_rating(defender, False, state)
        
        # Apply map advantage
        side_multiplier = (
            map_advantage['attack'] if attacking_team == 'team_a'
            else map_advantage['defense']
        )
        
        win_probability = (attacker_rating / (attacker_rating + defender_rating)) * side_multiplier
        
        # Determine outcome
        attacker_wins = random.random() < win_probability
        
        return {
            'type': 'combat',
            'attacker_id': attacker.id,
            'defender_id': defender.id,
            'winner_id': attacker.id if attacker_wins else defender.id,
            'loser_id': defender.id if attacker_wins else attacker.id,
            'time': state.time_remaining
        }
    
    def _calculate_combat_rating(self, player: Player, is_attacker: bool, state: RoundState) -> float:
        """Calculate a player's combat effectiveness rating."""
        # Base combat rating from player stats
        base_rating = (
            player.aim * 0.4 +
            player.game_sense * 0.3 +
            player.clutch * 0.2 +
            player.utility_usage * 0.1
        )
        
        # Apply form and fatigue modifiers
        rating = base_rating * (1 + (player.form - 70) * 0.01) * (1 - player.fatigue * 0.005)
        
        # Role and position modifiers
        if is_attacker:
            if player.role_proficiency.get('Duelist', 0) > 70:
                rating *= 1.1
        else:
            if player.role_proficiency.get('Sentinel', 0) > 70:
                rating *= 1.1
        
        # Ultimate availability bonus
        team = 'team_a' if player in state.team_a_players_alive else 'team_b'
        if (team == 'team_a' and state.ultimates_available_a.get(player.id)) or \
           (team == 'team_b' and state.ultimates_available_b.get(player.id)):
            rating *= 1.2
        
        return rating
    
    def _simulate_utility_usage(self, state: RoundState) -> Optional[Dict]:
        """Simulate utility usage and its effects."""
        # Select random player to use utility
        all_alive = state.team_a_players_alive + state.team_b_players_alive
        if not all_alive:
            return None
            
        player = random.choice(all_alive)
        utility_rating = player.utility_usage
        
        # Determine utility effectiveness
        effectiveness = random.random() * utility_rating / 100
        damage = int(effectiveness * 50)  # Max 50 damage from utility
        
        return {
            'type': 'utility',
            'player_id': player.id,
            'damage_dealt': damage,
            'time': state.time_remaining
        }
    
    def _simulate_spike_plant(self, state: RoundState, attacking_team: str) -> Optional[Dict]:
        """Simulate a spike plant attempt."""
        if state.spike_planted or state.time_remaining < self.SPIKE_PLANT_TIME:
            return None
            
        attackers = (
            state.team_a_players_alive if attacking_team == 'team_a'
            else state.team_b_players_alive
        )
        
        if not attackers:
            return None
            
        planter = random.choice(attackers)
        sites = ['A', 'B', 'C'] if self.map_name == 'Haven' else ['A', 'B']
        
        return {
            'type': 'plant',
            'player_id': planter.id,
            'site': random.choice(sites),
            'time': state.time_remaining
        }
    
    def _simulate_spike_defuse(self, state: RoundState, attacking_team: str) -> Optional[Dict]:
        """Simulate a spike defuse attempt."""
        if not state.spike_planted or state.time_remaining < self.SPIKE_DEFUSE_TIME:
            return None
            
        defenders = (
            state.team_b_players_alive if attacking_team == 'team_a'
            else state.team_a_players_alive
        )
        
        if not defenders:
            return None
            
        defuser = random.choice(defenders)
        
        return {
            'type': 'defuse',
            'player_id': defuser.id,
            'time': state.time_remaining
        }
    
    def _apply_event(self, state: RoundState, event: Dict):
        """Apply event effects to the round state."""
        if event['type'] == 'combat':
            # Remove loser from alive players
            if event['loser_id'] in [p.id for p in state.team_a_players_alive]:
                state.team_a_players_alive = [
                    p for p in state.team_a_players_alive
                    if p.id != event['loser_id']
                ]
            else:
                state.team_b_players_alive = [
                    p for p in state.team_b_players_alive
                    if p.id != event['loser_id']
                ]
        elif event['type'] == 'plant':
            state.spike_planted = True
            state.plant_site = event['site']
            state.time_remaining = min(state.time_remaining, self.POST_PLANT_TIME)
        elif event['type'] == 'defuse':
            state.spike_planted = False
        
        # Update time
        time_taken = random.randint(5, 15)
        state.time_remaining = max(0, state.time_remaining - time_taken)
    
    def _is_round_over(self, state: RoundState) -> bool:
        """Check if the round is over."""
        # Time ran out
        if state.time_remaining <= 0:
            return True
        
        # All players on one team eliminated
        if not state.team_a_players_alive or not state.team_b_players_alive:
            return True
        
        # Spike detonated
        if state.spike_planted and state.time_remaining <= 0:
            return True
        
        return False
    
    def _determine_round_winner(self, state: RoundState) -> str:
        """Determine which team won the round."""
        attacking_team = 'team_a' if self._is_team_a_attacking(state.round_number) else 'team_b'
        
        # Spike detonated
        if state.spike_planted and state.time_remaining <= 0:
            return attacking_team
        
        # Time ran out without plant
        if state.time_remaining <= 0 and not state.spike_planted:
            return 'team_b' if attacking_team == 'team_a' else 'team_a'
        
        # Team elimination
        if not state.team_a_players_alive:
            return 'team_b'
        if not state.team_b_players_alive:
            return 'team_a'
        
        # Shouldn't reach here
        return 'team_a'
    
    def _update_economy(
        self,
        round_result: Dict,
        team_a_credits: Dict[str, int],
        team_b_credits: Dict[str, int],
        team_a_loss_bonus: int,
        team_b_loss_bonus: int
    ):
        """Update team economies after a round."""
        # Award round win bonus
        winning_team = round_result['winner']
        if winning_team == 'team_a':
            for player_id in team_a_credits:
                team_a_credits[player_id] = min(9000, team_a_credits[player_id] + self.ROUND_WIN_REWARD)
            for player_id in team_b_credits:
                loss_bonus = self.LOSS_BONUS_BASE + (team_b_loss_bonus * self.LOSS_BONUS_INCREMENT)
                team_b_credits[player_id] = min(9000, team_b_credits[player_id] + loss_bonus)
        else:
            for player_id in team_b_credits:
                team_b_credits[player_id] = min(9000, team_b_credits[player_id] + self.ROUND_WIN_REWARD)
            for player_id in team_a_credits:
                loss_bonus = self.LOSS_BONUS_BASE + (team_a_loss_bonus * self.LOSS_BONUS_INCREMENT)
                team_a_credits[player_id] = min(9000, team_a_credits[player_id] + loss_bonus)
        
        # Award kill bonuses
        for event in round_result['events']:
            if event['type'] == 'combat':
                winner_credits = team_a_credits if event['winner_id'] in team_a_credits else team_b_credits
                winner_credits[event['winner_id']] = min(9000, winner_credits[event['winner_id']] + self.KILL_REWARD)
    
    def _update_performances(self, round_result: Dict):
        """Update player performance statistics based on round events."""
        for event in round_result['events']:
            if event['type'] == 'combat':
                # Update winner stats
                winner_perf = self.performances[event['winner_id']]
                winner_perf.kills += 1
                winner_perf.damage_dealt += random.randint(150, 200)
                if event == round_result['events'][0]:  # First blood
                    winner_perf.first_bloods += 1
                
                # Update loser stats
                loser_perf = self.performances[event['loser_id']]
                loser_perf.deaths += 1
                if event == round_result['events'][0]:  # First death
                    loser_perf.first_deaths += 1
            
            elif event['type'] == 'utility':
                perf = self.performances[event['player_id']]
                perf.utility_damage += event['damage_dealt']
                perf.utility_casts += 1
    
    def _is_match_complete(self) -> bool:
        """Check if the match is complete."""
        # Regular time
        if self.match.current_round < 24:
            if self.match.team_a_score == 13 or self.match.team_b_score == 13:
                return True
            return False
        
        # Overtime
        score_diff = abs(self.match.team_a_score - self.match.team_b_score)
        if score_diff >= 2:
            return True
        
        return False
    
    def _finalize_match(self):
        """Finalize match statistics and update player/team stats."""
        self.match.status = "completed"
        self.match.end_time = datetime.utcnow()
        
        # Calculate final performance ratings
        for perf in self.performances.values():
            perf.calculate_rating()
        
        # Determine MVP
        mvp_performance = max(
            self.performances.values(),
            key=lambda p: p.impact_score
        )
        self.match.mvp_player_id = mvp_performance.player_id
        
        # Update team stats
        winner = self.team_a if self.match.team_a_score > self.match.team_b_score else self.team_b
        loser = self.team_b if winner == self.team_a else self.team_a
        
        winner.match_wins += 1
        loser.match_losses += 1
        
        # Update player stats
        for player in self.team_a.active_roster + self.team_b.active_roster:
            perf = self.performances[player.id]
            player.matches_played += 1
            player.kills += perf.kills
            player.deaths += perf.deaths
            player.assists += perf.assists
            player.first_bloods += perf.first_bloods
            player.clutches_won += perf.clutches_won
            
            # Update form based on performance
            player.update_form(perf.rating)
            
            # Add fatigue
            player.fatigue = min(100, player.fatigue + random.randint(5, 15)) 