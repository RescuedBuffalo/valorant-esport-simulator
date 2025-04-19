"""
Valorant simulation game module.
"""
import sys
import random
from typing import Dict, List, Optional
from .simulation.player_generator import PlayerGenerator
from .simulation.match_engine import MatchEngine
from .simulation.weapons import WeaponFactory

class ValorantSim:
    def __init__(self):
        self.player_generator = PlayerGenerator()
        self.match_engine = MatchEngine()
        self.teams: Dict[str, List[Dict]] = {}
        self.maps = ["Ascent", "Bind", "Haven", "Split", "Icebox"]
        
    def generate_new_team(self, name: str, region: Optional[str] = None) -> None:
        """Generate a new team with 5 players."""
        self.teams[name] = self.player_generator.generate_team_roster(region=region)
        print(f"\nTeam {name} generated:")
        self._print_team(self.teams[name])
        
    def _print_team(self, team: List[Dict]) -> None:
        """Print team roster details."""
        for player in team:
            print(f"\n{player['gamerTag']} ({player['firstName']} {player['lastName']}):")
            print(f"  Role: {player['primaryRole']}")
            print(f"  Region: {player['region']}")
            print(f"  Core Stats:")
            for stat, value in player['coreStats'].items():
                print(f"    {stat}: {value:.1f}")
                
    def simulate_match(self, team_a_name: str, team_b_name: str) -> None:
        """Simulate a match between two teams."""
        if team_a_name not in self.teams or team_b_name not in self.teams:
            print("Error: Team not found!")
            return
            
        map_name = random.choice(self.maps)
        print(f"\nMatch starting on {map_name}")
        print(f"{team_a_name} vs {team_b_name}")
        
        match_result = self.match_engine.simulate_match(
            self.teams[team_a_name],
            self.teams[team_b_name],
            map_name
        )
        
        print("\nMatch Results:")
        print(f"Score: {team_a_name} {match_result['score']['team_a']} - {match_result['score']['team_b']} {team_b_name}")
        print(f"Duration: {match_result['duration']} minutes")
        
        # Print round details
        print("\nRound Summary:")
        for i, round_data in enumerate(match_result['rounds'], 1):
            winner = team_a_name if round_data['winner'] == 'team_a' else team_b_name
            print(f"\nRound {i}:")
            print(f"  Winner: {winner}")
            print(f"  Economy:")
            print(f"    {team_a_name}: {round_data['economy']['team_a']}")
            print(f"    {team_b_name}: {round_data['economy']['team_b']}")
            if round_data.get('spike_planted'):
                print("  Spike was planted!")
            if round_data.get('clutch_player'):
                clutch_team = team_a_name if round_data['winner'] == 'team_a' else team_b_name
                print(f"  Clutch play by {clutch_team}!")
                
    def run_cli(self):
        """Run the command-line interface."""
        print("Welcome to Valorant Simulation!")
        
        while True:
            print("\nAvailable commands:")
            print("1. Generate new team")
            print("2. List teams")
            print("3. View team details")
            print("4. Simulate match")
            print("5. Exit")
            
            choice = input("\nEnter your choice (1-5): ")
            
            if choice == "1":
                name = input("Enter team name: ")
                region = input("Enter region (NA/EU/APAC/BR/LATAM) or press Enter for random: ")
                if not region:
                    region = None
                self.generate_new_team(name, region)
                
            elif choice == "2":
                print("\nTeams:")
                for team_name in self.teams:
                    print(f"- {team_name}")
                    
            elif choice == "3":
                name = input("Enter team name: ")
                if name in self.teams:
                    self._print_team(self.teams[name])
                else:
                    print("Team not found!")
                    
            elif choice == "4":
                if len(self.teams) < 2:
                    print("Need at least 2 teams to simulate a match!")
                    continue
                    
                print("\nAvailable teams:")
                for team_name in self.teams:
                    print(f"- {team_name}")
                    
                team_a = input("Enter first team name: ")
                team_b = input("Enter second team name: ")
                self.simulate_match(team_a, team_b)
                
            elif choice == "5":
                print("Thanks for playing!")
                sys.exit(0)
                
            else:
                print("Invalid choice!") 