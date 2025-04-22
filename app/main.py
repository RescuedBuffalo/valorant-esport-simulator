"""
Main application entry point.
"""
import logging
import traceback
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.analytics import Analytics
from app.core.prometheus import setup_instrumentator, ERROR_COUNT, REQUEST_LATENCY, ACTIVE_USERS
from app.core.config import settings
from app.db.session import engine
from app.db.init_db import init_db
from app.models import match_history, team, player, league

# Initialize the database
init_db()

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

# Setup Prometheus monitoring
setup_instrumentator(app)

@app.middleware("http")
async def track_requests(request: Request, call_next):
    """Middleware to track all requests."""
    # Log request details
    logger.info(f"Request: {request.method} {request.url.path} - Client: {request.client.host}")
    
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Record request latency
        duration = time.time() - start_time
        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
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
            
            # Track active users
            ACTIVE_USERS.inc()
        
        return response
    except Exception as e:
        # Track errors
        ERROR_COUNT.labels(
            type=type(e).__name__,
            location=f"{request.method}:{request.url.path}"
        ).inc()
        
        # Re-raise the exception
        raise

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info("Starting up the Valorant Esports Simulator API...")
    # Reset active users gauge on startup
    ACTIVE_USERS.set(0)

@app.get("/")
async def root():
    """Root endpoint providing API information."""
    return {
        "message": "Welcome to Valorant Team Simulator API",
        "version": "0.1.0",
        "endpoints": {
            "teams": "/api/v1/teams",
            "players": "/api/v1/players",
            "matches": "/api/v1/matches",
            "tournaments": "/api/v1/tournaments",
            "leagues": "/api/v1/leagues",
            "metrics": "/metrics"
        }
    }

# Import and include routers
from app.api.v1 import team, player, match, tournament, league, metrics, maps

app.include_router(team.router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(player.router, prefix="/api/v1/players", tags=["players"])
app.include_router(match.router, prefix="/api/v1/matches", tags=["matches"])
app.include_router(tournament.router, prefix="/api/v1/tournaments", tags=["tournaments"])
app.include_router(league.router, prefix="/api/v1", tags=["leagues"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(maps.router, prefix="/api/v1/maps", tags=["maps"])

# For backward compatibility with the old API endpoints
from pydantic import BaseModel
from typing import Optional, Dict

class TeamCreate(BaseModel):
    name: str
    region: Optional[str] = None

class MatchCreate(BaseModel):
    team_a: str
    team_b: str
    map_name: Optional[str] = None

# Initialize ValorantSim for simple API
from .game import ValorantSim
game_sim = ValorantSim()

# Legacy compatibility endpoints for the old API
@app.get("/")
async def alt_root():
    """Health check endpoint (compatibility with old API)."""
    return {"status": "ok", "message": "Valorant Simulation API is running"}

@app.post("/teams/")
async def alt_create_team(team_data: TeamCreate):
    """Create a new team (compatibility with old API)."""
    try:
        team = game_sim.generate_new_team(team_data.name, team_data.region)
        return {"status": "success", "team": team}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/teams/")
async def alt_list_teams():
    """List all teams (compatibility with old API)."""
    return {"teams": game_sim.teams}

@app.get("/teams/{team_name}")
async def alt_get_team(team_name: str):
    """Get team details (compatibility with old API)."""
    if team_name not in game_sim.teams:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"team": game_sim.teams[team_name]}

@app.post("/matches/")
async def alt_simulate_match(match_data: MatchCreate):
    """Simulate a match between two teams (compatibility with old API)."""
    if match_data.team_a not in game_sim.teams or match_data.team_b not in game_sim.teams:
        raise HTTPException(status_code=404, detail="One or both teams not found")
    
    if match_data.team_a == match_data.team_b:
        raise HTTPException(status_code=400, detail="Cannot simulate match between same team")
    
    try:
        match_result = game_sim.simulate_match(match_data.team_a, match_data.team_b)
        return {"status": "success", "result": match_result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/regions/")
async def alt_get_regions():
    """Get available regions (compatibility with old API)."""
    return {
        "regions": ["NA", "EU", "APAC", "BR", "LATAM"]
    }

@app.get("/maps/")
async def alt_get_maps():
    """Get available maps (compatibility with old API)."""
    return {
        "maps": game_sim.maps
    }

# Original API v1 specific endpoints
@app.get("/api/v1/regions")
async def get_regions():
    """Get available regions."""
    return {
        "regions": ["NA", "EU", "APAC", "BR", "LATAM"]
    }

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    """Custom handler for 404 errors."""
    logger.warning(f"Not found: {request.url.path}")
    ERROR_COUNT.labels(type="NotFound", location=request.url.path).inc()
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The requested URL {request.url.path} was not found on this server.",
            "available_endpoints": {
                "teams": "/api/v1/teams",
                "players": "/api/v1/players",
                "matches": "/api/v1/matches",
                "tournaments": "/api/v1/tournaments",
                "leagues": "/api/v1/leagues"
            }
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    error_type = type(exc).__name__
    ERROR_COUNT.labels(type=error_type, location=request.url.path).inc()
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later."
        }
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