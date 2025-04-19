#!/usr/bin/env python3
"""
Interactive CLI for Valorant Simulation Game.
"""
from app.game import ValorantSim

def main():
    """Main entry point for the game."""
    print("🎮 Welcome to Valorant Team Simulation! 🎮")
    print("=" * 50)
    
    # Initialize the game
    game = ValorantSim()
    
    while True:
        print("\n📋 Main Menu:")
        print("1. Generate a new team")
        print("2. View existing teams")
        print("3. View team details")
        print("4. Simulate a match")
        print("5. Exit")
        
        try:
            choice = input("\nEnter your choice (1-5): ")
            
            if choice == "1":
                name = input("Enter team name: ").strip()
                print("\nAvailable regions: NA, EU, APAC, BR, LATAM")
                region = input("Enter region (or press Enter for random): ").strip().upper()
                if not region:
                    region = None
                elif region not in ["NA", "EU", "APAC", "BR", "LATAM"]:
                    print("❌ Invalid region! Using random region instead.")
                    region = None
                    
                game.generate_new_team(name, region)
                
            elif choice == "2":
                if not game.teams:
                    print("❌ No teams exist yet! Generate some teams first.")
                else:
                    print("\n🏢 Existing Teams:")
                    for team_name in game.teams:
                        print(f"- {team_name}")
                        
            elif choice == "3":
                if not game.teams:
                    print("❌ No teams exist yet! Generate some teams first.")
                    continue
                    
                print("\nAvailable teams:")
                for team_name in game.teams:
                    print(f"- {team_name}")
                    
                name = input("\nEnter team name to view: ").strip()
                if name in game.teams:
                    game._print_team(game.teams[name])
                else:
                    print("❌ Team not found!")
                    
            elif choice == "4":
                if len(game.teams) < 2:
                    print("❌ Need at least 2 teams to simulate a match!")
                    continue
                    
                print("\nAvailable teams:")
                for team_name in game.teams:
                    print(f"- {team_name}")
                    
                team_a = input("\nEnter first team name: ").strip()
                team_b = input("Enter second team name: ").strip()
                
                if team_a not in game.teams or team_b not in game.teams:
                    print("❌ One or both teams not found!")
                    continue
                    
                if team_a == team_b:
                    print("❌ Cannot simulate a match between the same team!")
                    continue
                    
                print(f"\n🎮 Starting match: {team_a} vs {team_b}")
                game.simulate_match(team_a, team_b)
                
            elif choice == "5":
                print("\n👋 Thanks for playing! See you next time!")
                break
                
            else:
                print("❌ Invalid choice! Please enter a number between 1 and 5.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Game interrupted. Thanks for playing!")
            break
        except Exception as e:
            print(f"❌ An error occurred: {str(e)}")
            print("Please try again.")

if __name__ == "__main__":
    main() 