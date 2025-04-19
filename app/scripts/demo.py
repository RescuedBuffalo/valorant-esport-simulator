#!/usr/bin/env python3

import sys
import os
import time
from datetime import datetime, timedelta
import json
from typing import Union

from app.simulation.player_generator import PlayerGenerator
from app.simulation.match_engine import MatchEngine
from app.simulation.player_validation import PlayerValidation

def print_separator(char="=", length=50):
    print(f"\n{char * length}\n")

def print_header(text):
    print(f"\n🎮 {text}")
    print_separator("=")

def format_stat(stat_name: str, value: Union[int, float, str]) -> str:
    """Format a stat value for display."""
    if isinstance(value, float):
        return f"{stat_name}: {value:.2f}"
    return f"{stat_name}: {value}"

def print_player_info(player, detailed=False):
    """Print player information with optional detail level."""
    print(f"Name: {player['firstName']} '{player['id']}' {player['lastName']}")
    print(f"Age: {player['age']} | Role: {player['primaryRole']} | Nationality: {player['nationality']}")
    
    print("\nCore Stats:")
    for stat, value in player['coreStats'].items():
        print(f"  {stat.capitalize()}: {value:.1f}")
    
    if detailed:
        print("\nRole Proficiencies:")
        for role, value in player['roleProficiencies'].items():
            print(f"  {role}: {value:.1f}")
        
        print("\nAgent Proficiencies:")
        for agent, value in player['agentProficiencies'].items():
            if value >= 80:  # Only show high proficiency agents
                print(f"  {agent}: {value:.1f}")
        
        print("\nCareer Stats:")
        for stat, value in player['careerStats'].items():
            if isinstance(value, float):
                print(f"  {stat}: {value:.2f}")
            else:
                print(f"  {stat}: {value}")
    
    print(f"\nSalary: ${player['salary']:,.2f}")

def print_match_round(round_num: int, round_data: dict):
    """Print detailed round information."""
    print(f"\nRound {round_num}:")
    print(f"Winner: {'Team A' if round_data['winner'] == 'team_a' else 'Team B'}")
    print(f"Economy: Team A ${round_data['economy']['team_a']:,} - ${round_data['economy']['team_b']:,} Team B")
    print(f"Survivors: {round_data['survivors']['team_a']} vs {round_data['survivors']['team_b']}")
    
    if round_data.get('spike_planted'):
        print("💣 Spike was planted!")
    if round_data.get('clutch_player'):
        print(f"🎯 Clutch play by: {round_data['clutch_player']}")

def demo_player_generation():
    print_header("Player Generation System")
    
    generator = PlayerGenerator()
    
    # Generate a star player
    print("Generating a star player (high rating)...")
    star_player = generator.generate_player(min_rating=85)
    print_player_info(star_player, detailed=True)
    print_separator("-")
    
    # Generate a rookie player
    print("Generating a rookie player (lower rating)...")
    rookie_player = generator.generate_player(max_rating=70, max_age=20)
    print_player_info(rookie_player)
    print_separator("-")
    
    # Generate a complete team roster
    print("Generating a complete team roster...")
    team_roster = generator.generate_team_roster()
    print(f"\nTeam Roster (Size: {len(team_roster)})")
    for i, player in enumerate(team_roster, 1):
        print(f"\nPlayer {i}:")
        print_player_info(player)
        print_separator("-", 30)

def demo_match_simulation():
    print_header("Match Simulation System")
    
    generator = PlayerGenerator()
    match_engine = MatchEngine()
    
    # Generate two balanced teams
    print("Generating Teams...")
    team_a = generator.generate_team_roster(min_rating=75, max_rating=90)
    team_b = generator.generate_team_roster(min_rating=75, max_rating=90)
    
    print("\nTeam A Roster:")
    for player in team_a:
        print(f"- {player['firstName']} '{player['primaryRole']}' {player['lastName']}")
    
    print("\nTeam B Roster:")
    for player in team_b:
        print(f"- {player['firstName']} '{player['primaryRole']}' {player['lastName']}")
    
    print_separator()
    print("Match Starting: Team A vs Team B")
    print("Map: Haven")
    print_separator()
    
    # Simulate match with delay for dramatic effect
    print("Simulating match...")
    time.sleep(1)
    match_result = match_engine.simulate_match(team_a, team_b, "Haven")
    
    # Print match results
    print("\n📊 Match Results:")
    print(f"Final Score: Team A {match_result['score']['team_a']} - {match_result['score']['team_b']} Team B")
    print(f"Match Duration: {match_result['duration']} minutes")
    
    if match_result.get('mvp'):
        mvp_id = match_result['mvp']
        mvp_team = 'A' if any(p['id'] == mvp_id for p in team_a) else 'B'
        mvp_player = next(p for p in (team_a + team_b) if p['id'] == mvp_id)
        print(f"\n🏆 MVP: {mvp_player['firstName']} '{mvp_player['primaryRole']}' {mvp_player['lastName']} (Team {mvp_team})")
    
    print("\n📈 Round History:")
    for round_num, round_data in enumerate(match_result['rounds'], 1):
        print_match_round(round_num, round_data)

def main():
    """Main demo script."""
    print_header("Welcome to Valorant Manager Simulator Demo")
    print("Version: 0.1.0")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_separator()
    
    try:
        # Run demonstrations
        demo_player_generation()
        time.sleep(1)  # Pause for readability
        demo_match_simulation()
        
    except Exception as e:
        print(f"\n❌ Error during demo: {str(e)}")
        return 1
    
    print_separator()
    print("✅ Demo completed successfully!")
    return 0

if __name__ == "__main__":
    # Add the project root to Python path
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.append(project_root)
    
    sys.exit(main()) 