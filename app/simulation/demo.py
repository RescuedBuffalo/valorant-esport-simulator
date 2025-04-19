"""
Demo script for the Valorant match simulation.
This demonstrates how to use the test data generator and match simulator.
"""

import json
from pprint import pprint

from app.simulation.test_data_generator import TestDataGenerator
from app.simulation.match_sim import MatchSimulator


def run_demo():
    """Run a demonstration of the match simulation system."""
    print("=== Valorant Match Simulation Demo ===")
    
    # Generate test data for two teams
    print("\nGenerating test match data...")
    match_data = TestDataGenerator.generate_test_match_data()
    
    team_a = match_data["team_a"]
    team_b = match_data["team_b"]
    team_a_players = match_data["team_a_players"]
    team_b_players = match_data["team_b_players"]
    
    # Print team information
    print(f"\nMatch: {team_a.name} ({team_a.region}) vs {team_b.name} ({team_b.region})")
    print(f"{team_a.name} Rating: {team_a.rating:.1f}, Chemistry: {team_a.chemistry:.1f}")
    print(f"{team_b.name} Rating: {team_b.rating:.1f}, Chemistry: {team_b.chemistry:.1f}")
    
    # Print roster information
    print(f"\n{team_a.name} Roster:")
    for player in team_a_players:
        print(f"  {player.firstName} '{player.lastName}' - {player.primaryRole.capitalize()} - Rating: {player.rating:.1f}")
    
    print(f"\n{team_b.name} Roster:")
    for player in team_b_players:
        print(f"  {player.firstName} '{player.lastName}' - {player.primaryRole.capitalize()} - Rating: {player.rating:.1f}")
    
    # Initialize match simulator
    print("\nInitializing match simulator...")
    simulator = MatchSimulator()
    
    # Run match simulation
    print("\nRunning match simulation...")
    match_result = simulator.simulate_match(
        team_a=team_a,
        team_b=team_b,
        team_a_players=team_a_players,
        team_b_players=team_b_players
    )
    
    # Print match results
    print("\n=== Match Results ===")
    print(f"Final Score: {team_a.name} {match_result['team_a_score']} - {match_result['team_b_score']} {team_b.name}")
    
    print("\nRound by Round:")
    for i, round_result in enumerate(match_result['rounds'], 1):
        winner = team_a.name if round_result['winner'] == 'team_a' else team_b.name
        print(f"Round {i}: {winner} wins - {round_result['summary']}")
    
    # Print player performances
    print("\n=== Player Performances ===")
    
    print(f"\n{team_a.name} Players:")
    sorted_a_performances = sorted(
        match_result['player_performances']['team_a'],
        key=lambda x: x['combat_score'],
        reverse=True
    )
    
    for perf in sorted_a_performances:
        player = next((p for p in team_a_players if p.id == perf['player_id']), None)
        if player:
            print(f"  {player.firstName} '{player.lastName}': {perf['kills']}/{perf['deaths']}/{perf['assists']} "
                  f"- ACS: {perf['combat_score']:.1f} - FB: {perf['first_bloods']}")
    
    print(f"\n{team_b.name} Players:")
    sorted_b_performances = sorted(
        match_result['player_performances']['team_b'],
        key=lambda x: x['combat_score'],
        reverse=True
    )
    
    for perf in sorted_b_performances:
        player = next((p for p in team_b_players if p.id == perf['player_id']), None)
        if player:
            print(f"  {player.firstName} '{player.lastName}': {perf['kills']}/{perf['deaths']}/{perf['assists']} "
                  f"- ACS: {perf['combat_score']:.1f} - FB: {perf['first_bloods']}")
    
    # Print MVP
    mvp_id = match_result['mvp']
    mvp_player = next((p for p in team_a_players + team_b_players if p.id == mvp_id), None)
    mvp_team = team_a.name if mvp_id in [p.id for p in team_a_players] else team_b.name
    
    if mvp_player:
        print(f"\nMatch MVP: {mvp_player.firstName} '{mvp_player.lastName}' from {mvp_team}")
    
    print("\n=== Demo Complete ===")


if __name__ == "__main__":
    run_demo() 