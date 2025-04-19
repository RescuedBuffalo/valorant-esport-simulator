#!/usr/bin/env python3
"""
Demo match script for Valorant Simulation.
"""
from app.game import ValorantSim

def run_demo():
    """Run a demo match between two teams."""
    sim = ValorantSim()
    
    # Generate two teams
    print("Generating Team Sentinels (NA)...")
    sim.generate_new_team("Sentinels", "NA")
    
    print("\nGenerating Team Fnatic (EU)...")
    sim.generate_new_team("Fnatic", "EU")
    
    # Run a match between them
    print("\nStarting match: Sentinels vs Fnatic")
    sim.simulate_match("Sentinels", "Fnatic")

if __name__ == "__main__":
    run_demo() 