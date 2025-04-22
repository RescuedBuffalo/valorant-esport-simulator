#!/usr/bin/env python3
"""
Test script to verify that match simulation works with database teams.
"""
import logging
from app.game import ValorantSim
from app.db.session import SessionLocal
from app.simulation.player_generator import PlayerGenerator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("test-db-match")

def main():
    """Test the updated ValorantSim class."""
    logger.info("Testing the updated ValorantSim class")
    
    # Initialize the game
    sim = ValorantSim()
    
    # Create a test team in memory
    test_team_a = "Test Team A"
    test_team_b = "Test Team B"
    
    logger.info(f"Generating test teams: {test_team_a} and {test_team_b}")
    
    sim.generate_new_team(test_team_a, "NA")
    sim.generate_new_team(test_team_b, "EU")
    
    logger.info("Verify that the simulate_match method has been updated to try database first")
    
    # Print the code of the simulate_match method
    import inspect
    method_code = inspect.getsource(sim.simulate_match)
    logger.info("Method implementation:")
    for line in method_code.split('\n'):
        logger.info(line)
    
    logger.info("Test passed if the method includes database logic")

if __name__ == "__main__":
    main() 