"""
Main application entry point.
"""
import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.analytics import Analytics
from app.core.config import settings
from app.db.session import engine
from app.models import match_history

# Create database tables
match_history.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("valorant-sim")

app = FastAPI(
    title="Valorant Esports Simulator",
    description="A management simulation game for Valorant esports",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analytics
analytics = Analytics(
    mixpanel_token=settings.MIXPANEL_TOKEN,
    environment=settings.ENVIRONMENT,
    sentry_dsn=settings.SENTRY_DSN
)

@app.middleware("http")
async def track_requests(request: Request, call_next):
    """Middleware to track all requests."""
    # Log request details
    logger.info(f"Request: {request.method} {request.url.path} - Client: {request.client.host}")
    
    response = await call_next(request)
    
    # Log response status
    logger.info(f"Response: {response.status_code}")
    
    if hasattr(request.state, "user_id"):
        # Get session ID safely, with default if not present
        session_id = getattr(request.session, "session_id", None) if hasattr(request, "session") else None
        
        analytics.track_user_session(
            user_id=request.state.user_id,
            session_id=session_id or "anonymous",
            request=request
        )
    
    return response

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Valorant Esports Simulator API"}

# Import and include routers
from app.api.v1 import team, player, match, tournament

app.include_router(team.router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(player.router, prefix="/api/v1/players", tags=["players"])
app.include_router(match.router, prefix="/api/v1/match", tags=["matches"])
app.include_router(tournament.router, prefix="/api/v1/tournaments", tags=["tournaments"])

@app.get("/api/v1/regions")
async def get_regions():
    """Get available regions."""
    return {
        "regions": ["NA", "EU", "APAC", "BR", "LATAM"]
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    # Log the full exception with traceback
    error_details = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error(f"Unhandled exception for {request.method} {request.url.path}:\n{error_details}")
    
    # Return a generic error response to the client
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "error_type": str(type(exc).__name__)}
    )

"""
Main entry point for the Valorant simulation game.
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
                
    def simulate_match(self, team_a_name: str, team_b_name: str) -> Dict:
        """Simulate a match between two teams."""
        logger.info(f"Simulating match: {team_a_name} vs {team_b_name}")
        
        if team_a_name not in self.teams or team_b_name not in self.teams:
            logger.error(f"Team not found. Available teams: {list(self.teams.keys())}")
            raise ValueError(f"Team not found. Teams requested: {team_a_name}, {team_b_name}")
            
        map_name = random.choice(self.maps)
        logger.info(f"Selected map: {map_name}")
        
        try:
            match_result = self.match_engine.simulate_match(
                self.teams[team_a_name],
                self.teams[team_b_name],
                map_name
            )
            
            # Log match result summary
            logger.info(f"Match completed. Score: {team_a_name} {match_result['score']['team_a']} - {match_result['score']['team_b']} {team_b_name}")
            
            # Update team stats
            winner = team_a_name if match_result["score"]["team_a"] > match_result["score"]["team_b"] else team_b_name
            loser = team_b_name if winner == team_a_name else team_a_name
            
            self.teams[winner]["stats"]["wins"] += 1
            self.teams[loser]["stats"]["losses"] += 1
            
            return match_result
        except Exception as e:
            logger.error(f"Error simulating match: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
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