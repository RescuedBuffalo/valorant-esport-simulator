"""
Main entry point for the Valorant simulation game.
"""
import sys
import random
from typing import Dict, List, Optional
from .simulation.player_generator import PlayerGenerator
from .simulation.match_engine import MatchEngine
from .simulation.weapons import WeaponFactory
from .simulation.maps import map_collection
from .repositories.team_repository import TeamRepository
from .db.session import SessionLocal

class ValorantSim:
    def __init__(self):
        self.player_generator = PlayerGenerator()
        self.match_engine = MatchEngine()
        self.teams: Dict[str, List[Dict]] = {}
        self.maps = map_collection.get_all_map_names()
        
    def generate_new_team(self, name: str, region: Optional[str] = None) -> Dict:
        """Generate a new team with 5 players."""
        roster = self.player_generator.generate_team_roster(region=region)
        team = {
            "name": name,
            "region": region or "Unknown",
            "roster": roster,
            "stats": {
                "wins": 0,
                "losses": 0,
                "tournaments_won": 0,
                "prize_money": 0
            }
        }
        self.teams[name] = team
        return team
        
    def _print_team(self, team: List[Dict]) -> None:
        """Print team roster details."""
        for player in team["roster"]:
            print(f"\n{player['gamerTag']} ({player['firstName']} {player['lastName']}):")
            print(f"  Role: {player['primaryRole']}")
            print(f"  Region: {player['region']}")
            print(f"  Core Stats:")
            for stat, value in player['coreStats'].items():
                print(f"    {stat}: {value:.1f}")
                
    def simulate_match(self, team_a_name: str, team_b_name: str) -> Dict:
        """Simulate a match between two teams."""
        # Use database teams instead of in-memory teams
        with SessionLocal() as db:
            # Try to find teams by ID first, then by name
            team_a_db = TeamRepository.get_team_by_id(db, team_a_name)
            if not team_a_db:
                team_a_db = TeamRepository.get_team_by_name(db, team_a_name)
                
            team_b_db = TeamRepository.get_team_by_id(db, team_b_name)
            if not team_b_db:
                team_b_db = TeamRepository.get_team_by_name(db, team_b_name)
            
            if not team_a_db or not team_b_db:
                raise ValueError("One or both teams not found in database")
            
            # Get players for both teams
            team_a_players = TeamRepository.get_team_players(db, team_a_db.id)
            team_b_players = TeamRepository.get_team_players(db, team_b_db.id)
            
            # Convert players to match engine format
            team_a_roster = self._transform_players_for_engine(team_a_players)
            team_b_roster = self._transform_players_for_engine(team_b_players)
            
            map_name = random.choice(self.maps)
            
            match_result = self.match_engine.simulate_match(
                team_a_roster,
                team_b_roster,
                map_name
            )
            
            # Update team stats
            winner = team_a_name if match_result["score"]["team_a"] > match_result["score"]["team_b"] else team_b_name
            loser = team_b_name if winner == team_a_name else team_a_name
            
            # In-memory update for compatibility
            if team_a_name in self.teams:
                self.teams[winner]["stats"]["wins"] += 1
            if team_b_name in self.teams:
                self.teams[loser]["stats"]["losses"] += 1
            
            return match_result
    
    def _transform_players_for_engine(self, players) -> List[Dict]:
        """Transform player data from database format to match engine format."""
        engine_players = []
        for player in players:
            player_dict = {
                'id': player.id,
                'firstName': player.first_name,
                'lastName': player.last_name,
                'gamerTag': player.gamer_tag,
                'age': player.age,
                'nationality': player.nationality,
                'region': player.region,
                'primaryRole': player.primary_role,
                'salary': player.salary,
                'coreStats': {
                    'aim': player.aim,
                    'gameSense': player.game_sense,
                    'movement': player.movement,
                    'utilityUsage': player.utility_usage,
                    'communication': player.communication,
                    'clutch': player.clutch
                },
                'roleProficiencies': player.role_proficiencies,
                'agentProficiencies': player.agent_proficiencies
            }
            engine_players.append(player_dict)
        return engine_players

    def get_teams(self) -> List[Dict]:
        """Get all teams."""
        return list(self.teams.values())

    def get_team(self, name: str) -> Optional[Dict]:
        """Get a specific team by name."""
        return self.teams.get(name)

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

def main():
    """Entry point for the simulation."""
    sim = ValorantSim()
    sim.run_cli()

if __name__ == "__main__":
    main() 